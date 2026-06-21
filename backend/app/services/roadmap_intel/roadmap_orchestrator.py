"""Roadmap orchestrator — coordinates roadmap lifecycle."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.roadmap_intel.roadmap_models import RoadmapState, RoadmapEvent
from app.services.roadmap_intel.roadmap_repository import RoadmapRepository
from app.services.roadmap_intel.roadmap_mutation_engine import mutate_roadmap
from app.services.roadmap_intel.career_gap_engine import compute_gaps
from app.services.strategic_profile_service import load_intelligence_inputs

logger = logging.getLogger(__name__)


async def get_or_create_roadmap(
    db: AsyncSession, user_id: str, target_role: str, target_skills: list[str]
) -> RoadmapState:
    """Get existing roadmap or create a new one from gap analysis."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id, target_role)
    if state:
        return state

    inputs = await load_intelligence_inputs(db, user_id)
    user_skills = inputs["skills"]

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

    inputs = await load_intelligence_inputs(db, user_id)
    user_skills = inputs["skills"]

    result = mutate_roadmap(
        current_snapshot=state.roadmap_snapshot or {},
        user_skills=user_skills,
        target_skills=target_skills,
        completed_nodes=state.completed_nodes or [],
        deferred_nodes=state.deferred_nodes or [],
        preferred_domains=inputs["preferred_domains"],
        growth_velocity=inputs["growth_velocity"],
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

async def undo_node_action(db: AsyncSession, user_id: str, skill: str) -> None:
    """Revert a roadmap node from completed or deferred back to active/incomplete."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id)
    if not state:
        return

    completed = list(state.completed_nodes or [])
    deferred = list(state.deferred_nodes or [])

    modified = False
    if skill in completed:
        completed.remove(skill)
        modified = True
    if skill in deferred:
        deferred.remove(skill)
        modified = True

    if modified:
        await repo.update(state, completed_nodes=completed, deferred_nodes=deferred)
        await repo.append_event(RoadmapEvent(
            user_id=user_id, roadmap_state_id=state.id,
            event_type="node_reverted",
            structured_payload={"skill": skill},
        ))
