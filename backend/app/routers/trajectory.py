"""Career trajectory intelligence API."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.intelligence.intelligence_repository import IntelligenceRepository
from app.services.roadmap_intel.roadmap_repository import RoadmapRepository
from app.services.trajectory import compute_trajectory, TrajectoryRepository, TrajectoryEvent

router = APIRouter(prefix="/v1/trajectory", tags=["Career Trajectory"])


@router.get("/snapshot")
async def get_trajectory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current career trajectory snapshot, computing fresh if needed."""
    intel_repo = IntelligenceRepository(db)
    roadmap_repo = RoadmapRepository(db)
    traj_repo = TrajectoryRepository(db)

    # Gather signals
    skills_db = await intel_repo.get_user_skills(current_user.id)
    profile = await intel_repo.get_or_create_career_profile(current_user.id)
    roadmap = await roadmap_repo.get_active(current_user.id)

    user_skills = [s.normalized_skill for s in skills_db]
    confidences = {s.normalized_skill: s.confidence_score for s in skills_db}
    completed = roadmap.completed_nodes if roadmap else []
    deferred = roadmap.deferred_nodes if roadmap else []

    # Get previous snapshot for drift detection
    previous = await traj_repo.get_latest(current_user.id)
    previous_dominant = previous.dominant_path if previous else None

    # Compute trajectory
    result = compute_trajectory(
        user_skills=user_skills,
        skill_confidences=confidences,
        completed_nodes=completed or [],
        deferred_nodes=deferred or [],
        growth_velocity=profile.growth_velocity or 0.0,
        previous_dominant=previous_dominant,
    )

    # Persist snapshot
    await traj_repo.upsert(current_user.id, {
        "dominant_path": result["dominant_path"],
        "secondary_paths": result["secondary_paths"],
        "readiness_scores": result["readiness_scores"],
        "specializations": result["specializations"],
        "adjacent_roles": result["adjacent_roles"],
        "competitiveness_score": result["competitiveness_score"],
        "confidence_score": result["confidence"],
        "drift_detected": result["drift_details"],
    })

    # Log event if drift detected
    if result["drift_detected"]:
        await traj_repo.append_event(TrajectoryEvent(
            user_id=current_user.id,
            event_type="trajectory_drift",
            structured_payload={"from": previous_dominant, "to": result["dominant_path"]},
        ))

    return result


@router.get("/timeline")
async def get_trajectory_timeline(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = TrajectoryRepository(db)
    events = await repo.get_timeline(current_user.id)
    return {
        "events": [
            {"id": e.id, "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at}
            for e in events
        ]
    }
