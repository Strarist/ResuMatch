"""Progress & Execution API — behavioral intelligence endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.execution import compute_execution_profile
from app.services.risk import compute_career_risks, generate_interventions
from app.services.intelligence.orchestrator import run_intelligence_cycle
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository

router = APIRouter(prefix="/v1/progress", tags=["Progress"])


@router.get("/snapshot")
async def get_progress_snapshot(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full behavioral intelligence snapshot: execution, risks, interventions."""
    # Get intelligence context
    intel = await run_intelligence_cycle(db, current_user.id)
    summary = intel["summary"]
    trajectory = intel["trajectory"]
    market = intel["market"]

    # Get behavioral signals
    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(current_user.id)
    actions = await workspace_repo.get_actions(current_user.id)

    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []
    version = roadmap.roadmap_version if roadmap else 0

    action_dicts = [{"action": a.action, "type": a.recommendation_type} for a in actions]

    # Compute execution profile
    execution = compute_execution_profile(
        completed_nodes=completed,
        deferred_nodes=deferred,
        recommendation_actions=action_dicts,
        operational_events=[],
        roadmap_version=version,
        growth_velocity=summary.get("competitiveness", 0),
        last_upload_at=None,
        last_activity_at=roadmap.updated_at.isoformat() if roadmap and roadmap.updated_at else None,
    )

    # Compute risks
    risks = compute_career_risks(
        execution_profile=execution,
        trajectory=trajectory,
        market=market,
        user_skills=[s for s in trajectory.get("specializations", {}).keys()],
    )

    # Generate interventions
    interventions = generate_interventions(
        execution_profile=execution,
        career_risks=risks,
        trajectory=trajectory,
        market=market,
    )

    return {
        "execution": execution,
        "risks": risks,
        "interventions": interventions,
        "summary": {
            "dominant_path": summary.get("dominant_path"),
            "competitiveness": summary.get("competitiveness"),
            "focus_areas": summary.get("focus_areas"),
        },
    }
