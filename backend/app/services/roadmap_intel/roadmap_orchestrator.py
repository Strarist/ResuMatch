"""Roadmap orchestrator — coordinates roadmap lifecycle."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intelligence import IntelligenceRepository
from app.services.roadmap_intel.roadmap_models import RoadmapState, RoadmapEvent
from app.services.roadmap_intel.roadmap_repository import RoadmapRepository
from app.services.roadmap_intel.roadmap_mutation_engine import mutate_roadmap

logger = logging.getLogger(__name__)


async def get_or_create_roadmap(
    db: AsyncSession, user_id: UUID, target_role: str, target_skills: list[str]
) -> RoadmapState:
    """Get existing roadmap or create a new one."""
    repo = RoadmapRepository(db)
    state = await repo.get_active(user_id, target_role)
    if state:
        return state

    # Create initial roadmap from gap analysis
    intel_repo = IntelligenceRepository(db)
    user_skills_db = await intel_repo.get_user_skills(user_id)
    user_skills = [s.normalized_skill for s in user_skills_db]

    from app.ai.roadmap import generate_roadmap
    from dataclasses import asdict
    roadmap = generate_roadmap(target_skills, user_skills)

    state = await repo.create(
        user_id=user_id,
        target_role=target_role,
        roadmap_snapshot={"milestones": [asdict(m) for m in roadmap.milestones]},
        active_focus_areas=list(set(m.skill for m in roadmap.milestones if m.priority == "high"))[:3],
        confidence_model={"coverage": len(user_skills) / max(len(target_skills), 1)},
    )

    await repo.append_event(RoadmapEvent(
        user_id=user_id, roadmap_state_id=state.id,
        event_type="roadmap_created",
        structured_payload={"target_role": target_role, "milestones": len(roadmap.milestones)},
    ))
    return state


async def mutate_existing_roadmap(db: AsyncSession, user_id: UUID, target_skills: list[str]) -> dict | None:
    """Mutate the active roadmap based on current intelligence. Returns mutations or None."""
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
            event_type="roadmap_reprioritized",
            structured_payload={"mutations": result["mutations"], "new_focus": result["new_focus_areas"]},
        ))
        logger.info(f"Roadmap mutated for user {user_id}: {len(result['mutations'])} changes")

    return result


async def complete_node(db: AsyncSession, user_id: UUID, skill: str) -> None:
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


async def defer_node(db: AsyncSession, user_id: UUID, skill: str) -> None:
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
