"""Adaptive roadmap intelligence API."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.roadmap_intel import (
    get_or_create_roadmap, mutate_existing_roadmap, complete_node, defer_node, undo_node_action, RoadmapRepository,
)

router = APIRouter(prefix="/v1/roadmap-intel", tags=["Roadmap Intelligence"])


class CreateRoadmapRequest(BaseModel):
    target_role: str = Field(min_length=2)
    target_skills: list[str] = Field(min_length=1)


class MutateRequest(BaseModel):
    target_skills: list[str] = Field(min_length=1)


class NodeActionRequest(BaseModel):
    skill: str


@router.get("/state")
async def get_roadmap_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = RoadmapRepository(db)
    state = await repo.get_active(current_user.id)
    if not state:
        return {"state": None}
    return {
        "state": {
            "id": state.id,
            "target_role": state.target_role,
            "version": state.roadmap_version,
            "snapshot": state.roadmap_snapshot,
            "completed_nodes": state.completed_nodes,
            "deferred_nodes": state.deferred_nodes,
            "active_focus_areas": state.active_focus_areas,
            "learning_velocity": state.learning_velocity,
            "last_generated_at": state.last_generated_at,
        }
    }


@router.post("/create")
async def create_roadmap(
    body: CreateRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    state = await get_or_create_roadmap(db, current_user.id, body.target_role, body.target_skills)
    return {
        "state": {
            "id": state.id,
            "target_role": state.target_role,
            "version": state.roadmap_version,
            "snapshot": state.roadmap_snapshot,
            "active_focus_areas": state.active_focus_areas,
        }
    }


@router.post("/mutate")
async def mutate_roadmap_endpoint(
    body: MutateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await mutate_existing_roadmap(db, current_user.id, body.target_skills)
    if not result:
        return {"mutations": [], "message": "No active roadmap found"}
    return {
        "mutations": result["mutations"],
        "new_focus_areas": result["new_focus_areas"],
        "snapshot": result["snapshot"],
    }


@router.get("/timeline")
async def get_roadmap_timeline(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = RoadmapRepository(db)
    events = await repo.get_timeline(current_user.id)
    return {
        "events": [
            {"id": e.id, "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at}
            for e in events
        ]
    }


@router.post("/node/complete")
async def mark_node_complete(
    body: NodeActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.user_progress_service import track_milestone_completion
    await complete_node(db, current_user.id, body.skill)
    await track_milestone_completion(db, current_user.id, body.skill)
    return {"message": f"Node '{body.skill}' marked complete"}


@router.post("/node/defer")
async def mark_node_deferred(
    body: NodeActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await defer_node(db, current_user.id, body.skill)
    return {"message": f"Node '{body.skill}' deferred"}


@router.post("/node/undo")
async def undo_node_action_endpoint(
    body: NodeActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.user_progress_service import track_milestone_reversal
    await undo_node_action(db, current_user.id, body.skill)
    await track_milestone_reversal(db, current_user.id, body.skill)
    return {"message": f"Node '{body.skill}' status reverted to active"}


@router.post("/recalibrate")
async def recalibrate_roadmap_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Regenerate roadmap and opportunities based on the user's active profile in the database."""
    from app.models.strategic_profile import StrategicProfile
    from app.services.llm.generators import generate_adaptive_roadmap
    from app.services.opportunity_engine.ingestion import match_jobs_for_candidate
    from app.services.roadmap_intel.roadmap_models import RoadmapState
    from app.services.user_progress_service import track_score_update
    from app.services.cache import cache_invalidate
    from app.logger import logger
    from datetime import datetime, timezone
    from sqlalchemy import select

    logger.bind(user_id=current_user.id, event="recalibration_triggered").info(
        f"recalibration_triggered: Profile and roadmap recalibration requested for user {current_user.id}"
    )

    # 1. Fetch persistent strategic profile
    profile_result = await db.execute(
        select(StrategicProfile).where(StrategicProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        logger.bind(user_id=current_user.id).warning("Strategic profile not found during recalibration.")
        return {"message": "No profile found to recalibrate. Ingest a resume first."}

    # 2. Extract gaps from the profile trajectory state
    trajectory_state = profile.trajectory_state or {}
    readiness = trajectory_state.get("readiness_scores", {})
    dominant_path = trajectory_state.get("dominant_path", "Software Engineer")
    dominant_readiness = readiness.get(dominant_path, {})
    gaps = dominant_readiness.get("missing_core", [])

    # 3. Re-trigger adaptive roadmap generation
    logger.bind(user_id=current_user.id).info("Regenerating roadmap milestones via OpenRouter...")
    roadmap_nodes = await generate_adaptive_roadmap(
        target_role=profile.target_role,
        validated_skills=profile.inferred_skills,
        gaps=gaps
    )

    # 4. Re-trigger opportunities matching
    logger.bind(user_id=current_user.id).info("Regenerating opportunity matches...")
    match_result = await match_jobs_for_candidate(profile)

    # 5. Save changes to profile
    profile.opportunity_alignment = match_result["matches"]
    trajectory_state = profile.trajectory_state or {}
    if match_result.get("degraded"):
        trajectory_state["opportunity_feed"] = {
            "degraded": True,
            "message": match_result.get("message"),
        }
    else:
        trajectory_state.pop("opportunity_feed", None)
    profile.trajectory_state = trajectory_state
    profile.roadmap_progress = {
        "completedPercent": 0,
        "completedCount": 0,
        "totalCount": len(roadmap_nodes)
    }
    profile.calibration_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "Recalibrated roadmap and opportunities via manual refresh."
    })
    profile.updated_at = datetime.now(timezone.utc)

    # 6. Save changes to legacy RoadmapState
    roadmap_result = await db.execute(
        select(RoadmapState).where(RoadmapState.user_id == current_user.id)
    )
    legacy_roadmap = roadmap_result.scalar_one_or_none()
    if not legacy_roadmap:
        legacy_roadmap = RoadmapState(
            user_id=current_user.id,
            target_role=profile.target_role,
            roadmap_snapshot={"milestones": roadmap_nodes},
            active_focus_areas=gaps[:3],
            confidence_model={"coverage": dominant_readiness.get("score", 0.85)},
            learning_velocity=trajectory_state.get("competitiveness_score", 0.80)
        )
        db.add(legacy_roadmap)
    else:
        legacy_roadmap.roadmap_snapshot = {"milestones": roadmap_nodes}
        legacy_roadmap.active_focus_areas = gaps[:3]
        legacy_roadmap.roadmap_version += 1
        legacy_roadmap.last_generated_at = datetime.now(timezone.utc)
        legacy_roadmap.updated_at = datetime.now(timezone.utc)

    # 7. Calibrate User Progress
    await track_score_update(
        db=db,
        user_id=current_user.id,
        recruiter_score=float(trajectory_state.get("competitiveness_score", 0.80) * 100),
        market_readiness=float(trajectory_state.get("competitiveness_score", 0.80) * 100),
        specialization=profile.active_specialization
    )

    # 8. Invalidate Caches
    await cache_invalidate(f"opportunities:matches:{current_user.id}")
    await cache_invalidate(f"opportunities:gaps:{current_user.id}")
    await cache_invalidate(f"opportunities:radar:{current_user.id}")
    await cache_invalidate(f"market_intelligence:snapshot:{current_user.id}")

    logger.bind(user_id=current_user.id, event="recalibration_success").info(
        f"recalibration_success: Roadmap and opportunities successfully recalibrated and saved for user {current_user.id}"
    )

    return {
        "message": "Roadmap and opportunities successfully recalibrated",
        "state": {
            "id": legacy_roadmap.id,
            "target_role": legacy_roadmap.target_role,
            "version": legacy_roadmap.roadmap_version,
            "snapshot": legacy_roadmap.roadmap_snapshot,
            "active_focus_areas": legacy_roadmap.active_focus_areas,
        }
    }
