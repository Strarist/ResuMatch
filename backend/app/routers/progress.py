"""Progress & Execution API — behavioral intelligence endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.execution import compute_execution_profile
from app.services.risk import compute_career_risks, generate_interventions
from app.services.intelligence.orchestrator import get_intelligence_summary_readonly
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository
from app.services.user_progress_service import get_user_progress_readonly

router = APIRouter(prefix="/v1/progress", tags=["Progress"])


def _empty_progression() -> dict:
    return {
        "resumes_uploaded": 0,
        "completed_milestones": 0,
        "achieved_tasks": 0,
        "recruiter_score": 0.0,
        "market_readiness": 0.0,
        "evolving_specialization": "General",
        "history": [],
    }


@router.get("/snapshot")
async def get_progress_snapshot(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full behavioral intelligence snapshot: execution, risks, interventions (read-only)."""
    intel = await get_intelligence_summary_readonly(db, current_user.id)
    summary = intel["summary"]
    trajectory = intel["trajectory"]
    market = intel["market"]

    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(current_user.id)
    actions = await workspace_repo.get_actions(current_user.id)

    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []
    version = roadmap.roadmap_version if roadmap else 0

    action_dicts = [{"action": a.action, "type": a.recommendation_type} for a in actions]

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

    risks = compute_career_risks(
        execution_profile=execution,
        trajectory=trajectory,
        market=market,
        user_skills=[s for s in trajectory.get("specializations", {}).keys()],
    )

    interventions = generate_interventions(
        execution_profile=execution,
        career_risks=risks,
        trajectory=trajectory,
        market=market,
    )

    progress_record = await get_user_progress_readonly(db, current_user.id)
    progression = (
        {
            "resumes_uploaded": progress_record.resumes_uploaded_count,
            "completed_milestones": progress_record.completed_milestones_count,
            "achieved_tasks": progress_record.achieved_tasks_count,
            "recruiter_score": progress_record.recruiter_score_record,
            "market_readiness": progress_record.market_readiness_record,
            "evolving_specialization": progress_record.evolving_specialization,
            "history": progress_record.progression_history,
        }
        if progress_record
        else _empty_progression()
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
        "progression": progression,
    }
