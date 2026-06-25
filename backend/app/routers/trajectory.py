"""Career trajectory intelligence API."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.strategic_profile_service import get_profile_context, load_legacy_skill_context
from app.services.roadmap_intel.roadmap_repository import RoadmapRepository
from app.services.trajectory import compute_trajectory, TrajectoryRepository, TrajectoryEvent

router = APIRouter(prefix="/v1/trajectory", tags=["Career Trajectory"])

_EMPTY_TRAJECTORY = {
    "dominant_path": "Generalist",
    "secondary_paths": [],
    "readiness_scores": {},
    "specializations": {},
    "adjacent_roles": [],
    "competitiveness_score": 0.0,
    "confidence": 0.0,
    "drift_detected": False,
    "drift_details": None,
}


def _snapshot_to_result(snapshot) -> dict:
    return {
        "dominant_path": snapshot.dominant_path,
        "secondary_paths": snapshot.secondary_paths or [],
        "readiness_scores": snapshot.readiness_scores or {},
        "specializations": snapshot.specializations or {},
        "adjacent_roles": snapshot.adjacent_roles or [],
        "competitiveness_score": snapshot.competitiveness_score or 0.0,
        "confidence": snapshot.confidence_score or 0.0,
        "drift_detected": bool(snapshot.drift_detected),
        "drift_details": snapshot.drift_detected,
    }


async def _gather_trajectory_inputs(db: AsyncSession, user_id: str) -> tuple[list[str], dict, list, list, float, str | None]:
    """Load skills and signals for trajectory computation."""
    ctx = await get_profile_context(db, user_id)
    roadmap_repo = RoadmapRepository(db)
    traj_repo = TrajectoryRepository(db)

    roadmap = await roadmap_repo.get_active(user_id)
    completed = roadmap.completed_nodes if roadmap else []
    deferred = roadmap.deferred_nodes if roadmap else []

    previous = await traj_repo.get_latest(user_id)
    previous_dominant = previous.dominant_path if previous else None

    if ctx["has_profile"]:
        return (
            ctx["skills"],
            ctx["skill_confidences"],
            completed or [],
            deferred or [],
            ctx["growth_velocity"],
            previous_dominant,
        )

    legacy = await load_legacy_skill_context(db, user_id)
    return (
        legacy["skills"],
        legacy["skill_confidences"],
        completed or [],
        deferred or [],
        legacy["growth_velocity"],
        previous_dominant,
    )


@router.get("/snapshot")
async def get_trajectory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return last persisted trajectory snapshot without recomputation."""
    traj_repo = TrajectoryRepository(db)
    snapshot = await traj_repo.get_latest(current_user.id)
    if snapshot:
        return _snapshot_to_result(snapshot)

    ctx = await get_profile_context(db, current_user.id)
    if ctx["has_profile"] and ctx["trajectory_state"]:
        ts = ctx["trajectory_state"]
        return {
            "dominant_path": ts.get("dominant_path", "Generalist"),
            "secondary_paths": ts.get("secondary_paths", []),
            "readiness_scores": ts.get("readiness_scores", {}),
            "specializations": ts.get("specializations", {}),
            "adjacent_roles": ts.get("adjacent_roles", []),
            "competitiveness_score": ts.get("competitiveness_score", 0.0),
            "confidence": ts.get("confidence", 0.0),
            "drift_detected": ts.get("drift_detected", False),
            "drift_details": ts.get("drift_details"),
        }

    return dict(_EMPTY_TRAJECTORY)


@router.post("/recompute")
async def recompute_trajectory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Explicitly recompute and persist career trajectory."""
    traj_repo = TrajectoryRepository(db)
    user_skills, confidences, completed, deferred, growth_velocity, previous_dominant = (
        await _gather_trajectory_inputs(db, current_user.id)
    )

    result = compute_trajectory(
        user_skills=user_skills,
        skill_confidences=confidences,
        completed_nodes=completed,
        deferred_nodes=deferred,
        growth_velocity=growth_velocity,
        previous_dominant=previous_dominant,
    )

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

    if result["drift_detected"]:
        await traj_repo.append_event(TrajectoryEvent(
            user_id=current_user.id,
            event_type="trajectory_drift",
            structured_payload={"from": previous_dominant, "to": result["dominant_path"]},
        ))

    return {"message": "Trajectory recomputed", "trajectory": result}


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
