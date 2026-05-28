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
        opps_list = [f"{o['title']} @ {o['company']} ({int(o['alignmentScore']*100)}% match)" for o in profile.opportunity_alignment[:3]]
        opportunities = "\n".join(opps_list)

    # 3. Construct Strategy system prompt
    system_prompt = COPILOT_STRATEGY_SYSTEM.format(
        target_role=target_role,
        specialization=specialization,
        validated_skills=validated_skills,
        gaps=gaps,
        opportunities=opportunities
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
    try:
        response = await llm_service.generate(
            messages=messages_payload,
            temperature=0.3
        )
        return response
    except Exception as e:
        logger.error(f"OpenRouter copilot chat failed: {e}. Executing legacy pattern backup.")
        return _fallback_deterministic_response(user_message, summary, recommendations)

def _fallback_deterministic_response(msg_text: str, s: dict, recs: list[dict]) -> str:
    msg = msg_text.lower().strip()
    path = s.get("dominant_path", "Software Engineering")
    top_rec = recs[0]["title"] if recs else "Ingest resume credentials to identify actions"
    return (
        f"I am your career intelligence copilot. I am currently running on local-caching safeguards due to a network timeout to our main inference layer.\n\n"
        f"Even with offline limits, your active **{path}** trajectory shows high priority action paths:\n"
        f"• Highest ROI Action: **{top_rec}**\n"
        f"• Key Recommendation: Please ensure your latest resume PDF is uploaded to calibrate skills taxonomies and calculate exact recruiter matching scores.\n\n"
        f"Once network connectivity is restored, I can compile customized sprint learning templates and outline specific GitHub validation projects."
    )

