"""Career Copilot Engine — OpenRouter LLM-driven strategic career copilot.

Uses persistent profile state and session message history to guide the candidate.
"""

from __future__ import annotations
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.strategic_profile import StrategicProfile
from app.services.llm.provider import llm_service
from app.services.llm.prompts import COPILOT_STRATEGY_SYSTEM

logger = logging.getLogger(__name__)

COPILOT_MARKET_CACHE_PREFIX = "copilot:market_snap:"


async def _get_market_snapshot_for_copilot(
    user_id: str | None,
    skills_list: list[str],
    confidences: dict[str, float],
    target_role: str,
    seniority: str,
) -> dict:
    """Return market intelligence snapshot, cached per user for 5 minutes."""
    from app.services.market_intelligence import compute_market_intelligence
    from app.services.cache import cache_get, cache_set

    if user_id:
        cache_key = f"{COPILOT_MARKET_CACHE_PREFIX}{user_id}"
        cached = await cache_get(cache_key)
        if cached:
            logger.debug("Copilot market snapshot cache hit for user %s", user_id)
            return cached

    market_snap = compute_market_intelligence(
        user_skills=skills_list,
        skill_confidences=confidences,
        target_role=target_role,
        seniority=seniority,
        growth_velocity=0.85,
    )

    if user_id:
        await cache_set(f"{COPILOT_MARKET_CACHE_PREFIX}{user_id}", market_snap, "medium")

    return market_snap


async def generate_copilot_response(
    db: AsyncSession,
    session_id: str,
    user_message: str,
    summary: dict,
    recommendations: list[dict]
) -> str:
    """Generate a highly contextual strategic career advisory response using OpenRouter and message history."""
    user_id = db.info.get("user_id")  # we can resolve user_id via profile search

    # 1. Fetch persistent strategic profile for the user
    # Search by matching user_id associated with workspace session
    from app.services.workspace.models import WorkspaceSession
    session_result = await db.execute(
        select(WorkspaceSession).where(WorkspaceSession.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    user_id = session.user_id if session else None

    profile = None
    if user_id:
        profile_result = await db.execute(
            select(StrategicProfile).where(StrategicProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()

    # 2. Extract context parameters
    target_role = profile.target_role if profile else summary.get("dominant_path", "Software Engineer")
    specialization = profile.active_specialization if profile else "Software Engineering"
    validated_skills = ", ".join(profile.inferred_skills) if profile else "None set"

    gaps = "None set"
    if profile and profile.recruiter_signals:
        fit = profile.recruiter_signals.get("roleFit", [])
        if fit:
            gaps = ", ".join(fit[0].get("missing", []))

    opportunities = "None matches found yet."
    if profile and profile.opportunity_alignment:
        opps_list = []
        for o in profile.opportunity_alignment[:3]:
            score = o.get("alignment_score") or o.get("alignmentScore") or 0.8
            company = o.get("company", "Company")
            title = o.get("title", "Position")
            opps_list.append(f"{title} @ {company} ({int(score * 100)}% match)")
        opportunities = "\n".join(opps_list)

    # 2.5 Compute and format real-world Market Snapshot and Demand Graph
    # Resolve skill confidences for accuracy
    skills_list = profile.inferred_skills if profile else []
    origins = {}
    if profile and profile.trajectory_state:
        origins = profile.trajectory_state.get("skill_origins", {}) or {}
    confidences = {s: 0.90 if origins.get(s) == "resume" else 0.70 for s in skills_list}

    market_snap = await _get_market_snapshot_for_copilot(
        user_id=user_id,
        skills_list=skills_list,
        confidences=confidences,
        target_role=target_role,
        seniority="senior" if user_id and len(skills_list) > 6 else "mid",
    )

    salary_range = market_snap["salary_trajectory"]["estimated_range"]
    market_snapshot_str = (
        f"Base salary standard: ${salary_range['low']:,} - ${salary_range['high']:,}. "
        f"Growth track potential: {market_snap['salary_trajectory']['growth_potential']}. "
        f"Hiring urgency level: {market_snap['curated_domain']['recruiterUrgency']} urgency. "
        f"Technical description: {market_snap['curated_domain']['description']}"
    )

    # Format recruiter demand graph into text
    graph_parts = []
    demand_graph = market_snap.get("demand_graph", {})
    for skill, idx in list(demand_graph.items())[:6]:
        graph_parts.append(
            f"{skill} (Demand: {int(idx['demand_score']*100)}%, Scarcity: {int(idx['scarcity_score']*100)}%, Scored Growth: {int(idx['growth_score']*100)}%)"
        )
    demand_graph_str = ", ".join(graph_parts) if graph_parts else "No active demand indexes registered."

    # 3. Construct Strategy system prompt
    system_prompt = COPILOT_STRATEGY_SYSTEM.format(
        target_role=target_role,
        specialization=specialization,
        validated_skills=validated_skills,
        gaps=gaps,
        opportunities=opportunities,
        market_snapshot=market_snapshot_str,
        demand_graph=demand_graph_str
    )

    # 4. Fetch session history to provide complete memory context
    from app.services.workspace.repository import WorkspaceRepository
    repo = WorkspaceRepository(db)
    history = await repo.get_messages(session_id)

    messages_payload = []
    messages_payload.append({"role": "system", "content": system_prompt})

    # Add historical messages (avoid repeating the very last user message which is appended manually)
    # The last message in history is the one we just saved inside the endpoint before calling this function.
    for h in history[:-1]:
        messages_payload.append({"role": h.role, "content": h.content})

    # Add the current user message
    messages_payload.append({"role": "user", "content": user_message})

    logger.info(f"Invoking OpenRouter chat completions for session: {session_id}")
    from app.services.copilot.refinement.response_compressor import compress_copilot_response
    try:
        response = await llm_service.generate(
            messages=messages_payload,
            temperature=0.3
        )
        return compress_copilot_response(response)
    except Exception as e:
        logger.error(f"OpenRouter copilot chat failed for session {session_id}: {e}. Retrying once.")
        try:
            response = await llm_service.generate(
                messages=messages_payload,
                temperature=0.2
            )
            return compress_copilot_response(response)
        except Exception as retry_err:
            logger.error(
                f"OpenRouter copilot retry failed for session {session_id}: {retry_err}. Using deterministic fallback."
            )
            fallback = _fallback_deterministic_response(user_message, summary, recommendations)
            return compress_copilot_response(fallback)

def _fallback_deterministic_response(msg_text: str, s: dict, recs: list[dict]) -> str:
    path = s.get("dominant_path", "Software Engineering")
    top_rec = recs[0]["title"] if recs else "calibrate your profile"
    return (
        f"[Fallback] I'm your senior career strategist. Live AI generation is temporarily unavailable, so this reply uses your saved profile data.\n\n"
        f"Based on your target **{path}** path, here is the most immediate tactical advice I have for you:\n"
        f"• **High-Impact Action**: Focus on completing **{top_rec}** to immediately strengthen your resume.\n"
        f"• **Next Step**: Make sure your latest resume is uploaded to your profile so I can outline specific technical project proofs to write.\n\n"
        f"Once our connection is refreshed, I can provide custom GitHub portfolio project outlines (like building database benchmarks or Redis-backed messaging systems) to demonstrate your skills directly to hiring managers."
    )
