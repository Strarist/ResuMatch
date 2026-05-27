"""Opportunities API — matches, gaps, radar."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.opportunities import compute_opportunity_matches, compute_opportunity_gaps, compute_opportunity_radar
from app.services.portfolio.recruiter_engine import compute_recruiter_profile
from app.services.portfolio.proof_engine import ProjectEvidence
from app.services.intelligence.orchestrator import run_intelligence_cycle
from app.services.execution import compute_execution_profile
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository

router = APIRouter(prefix="/v1/opportunities", tags=["Opportunities"])


async def _build_context(user_id: str, db: AsyncSession):
    """Shared context builder for opportunity endpoints."""
    intel = await run_intelligence_cycle(db, user_id)
    trajectory = intel["trajectory"]
    market = intel["market"]

    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(user_id)
    actions = await workspace_repo.get_actions(user_id)

    execution = compute_execution_profile(
        completed_nodes=(roadmap.completed_nodes or []) if roadmap else [],
        deferred_nodes=(roadmap.deferred_nodes or []) if roadmap else [],
        recommendation_actions=[{"action": a.action} for a in actions],
        operational_events=[], roadmap_version=roadmap.roadmap_version if roadmap else 0,
        growth_velocity=intel["summary"].get("competitiveness", 0),
        last_upload_at=None, last_activity_at=None,
    )

    result = await db.execute(select(ProjectEvidence).where(ProjectEvidence.user_id == user_id))
    projects = [{"project_name": p.project_name, "live_url": p.live_url, "deployment_platform": p.deployment_platform,
                 "ci_cd_present": p.ci_cd_present, "dockerized": p.dockerized, "cloud_services_used": p.cloud_services_used,
                 "ai_features_present": p.ai_features_present, "testing_present": p.testing_present,
                 "documentation_score": p.documentation_score, "architecture_complexity": p.architecture_complexity}
                for p in result.scalars().all()]

    recruiter = compute_recruiter_profile(trajectory=trajectory, execution_profile=execution,
                                          portfolio_projects=projects, market=market,
                                          user_skills=list(trajectory.get("specializations", {}).keys()))

    return trajectory, market, execution, recruiter


@router.get("/matches")
async def get_opportunity_matches(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    trajectory, market, execution, recruiter = await _build_context(current_user.id, db)
    return {"matches": compute_opportunity_matches(trajectory, recruiter, execution, market)}


@router.get("/gaps")
async def get_opportunity_gaps(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    trajectory, _, _, recruiter = await _build_context(current_user.id, db)
    return {"gaps": compute_opportunity_gaps(trajectory, recruiter)}


@router.get("/radar")
async def get_opportunity_radar(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    trajectory, market, execution, _ = await _build_context(current_user.id, db)
    return compute_opportunity_radar(trajectory, market, execution)
