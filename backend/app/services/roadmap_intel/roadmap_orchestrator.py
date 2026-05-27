"""Roadmap orchestrator — coordinates roadmap lifecycle."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intelligence.intelligence_repository import IntelligenceRepository
from app.services.roadmap_intel.roadmap_models import RoadmapState, RoadmapEvent
from app.services.roadmap_intel.roadmap_repository import RoadmapRepository
from app.services.roadmap_intel.roadmap_mutation_engine import mutate_roadmap
from app.services.roadmap_intel.career_gap_engine import compute_gaps

logger = logging.getLogger(__name__)


async def get_or_create_roadmap(
    db: AsyncSession, user_id: str, target_role: str, target_skills: list[str]
) -> RoadmapState:
    """Get existing roadmap or create a new one from gap analysis."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id, target_role)
    if state:
        return state

    intel_repo = IntelligenceRepository(db)
    user_skills_db = await intel_repo.get_user_skills(user_id)
    user_skills = [s.normalized_skill for s in user_skills_db]

    # Generate initial roadmap from gap analysis (no LLM)
    gaps = compute_gaps(user_skills, target_skills)
    milestones = []
    for gap in gaps["missing"][:10]:
        milestones.append({
            "skill": gap["skill"],
            "priority": gap["priority"],
            "effort_weeks": 3,
            "impact_estimate": 8.0,
            "reason": "Initial gap",
            "prerequisites": gap["adjacent_to"][:2],
        })

    focus_areas = [g["domain"] for g in gaps.get("near_ready", [])][:3]
    if not focus_areas and milestones:
        focus_areas = [m["skill"] for m in milestones if m["priority"] == "high"][:3]

    state = await repo.create(
        user_id=user_id,
        target_role=target_role,
        roadmap_snapshot={"milestones": milestones},
        active_focus_areas=focus_areas,
        confidence_model={"coverage": gaps["coverage"]},
    )

    await repo.append_event(RoadmapEvent(
        user_id=user_id, roadmap_state_id=state.id,
        event_type="roadmap_created",
        structured_payload={"target_role": target_role, "milestones": len(milestones)},
    ))
    return state


async def mutate_existing_roadmap(db: AsyncSession, user_id: str, target_skills: list[str]) -> dict | None:
    """Mutate the active roadmap based on current intelligence."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id)
    if not state:
        return None

    intel_repo = IntelligenceRepository(db)
    user_skills_db = await intel_repo.get_user_skills(user_id)
    user_skills = [s.normalized_skill for s in user_skills_db]

    profile = await intel_repo.get_or_create_career_profile(user_id)

    result = mutate_roadmap(
        current_snapshot=state.roadmap_snapshot or {},
        user_skills=user_skills,
        target_skills=target_skills,
        completed_nodes=state.completed_nodes or [],
        deferred_nodes=state.deferred_nodes or [],
        preferred_domains=profile.preferred_domains or [],
        growth_velocity=profile.growth_velocity or 0.0,
    )

    if result["mutations"]:
        await repo.update(state,
            roadmap_snapshot=result["snapshot"],
            active_focus_areas=result["new_focus_areas"],
            roadmap_version=state.roadmap_version + 1,
        )
        await repo.append_event(RoadmapEvent(
            user_id=user_id, roadmap_state_id=state.id,
            event_type="roadmap_mutated",
            structured_payload={"mutations": result["mutations"], "new_focus": result["new_focus_areas"]},
        ))
        logger.info(f"Roadmap mutated for user {user_id}: {len(result['mutations'])} changes")

    return result


async def complete_node(db: AsyncSession, user_id: str, skill: str) -> None:
    """Mark a roadmap node as completed."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id)
    if not state:
        return

    completed = list(state.completed_nodes or [])
    if skill not in completed:
        completed.append(skill)
        await repo.update(state, completed_nodes=completed)
        await repo.append_event(RoadmapEvent(
            user_id=user_id, roadmap_state_id=state.id,
            event_type="node_completed",
            structured_payload={"skill": skill},
        ))


async def defer_node(db: AsyncSession, user_id: str, skill: str) -> None:
    """Mark a roadmap node as deferred."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id)
    if not state:
        return

    deferred = list(state.deferred_nodes or [])
    if skill not in deferred:
        deferred.append(skill)
        await repo.update(state, deferred_nodes=deferred)
        await repo.append_event(RoadmapEvent(
            user_id=user_id, roadmap_state_id=state.id,
            event_type="node_deferred",
            structured_payload={"skill": skill},
        ))
