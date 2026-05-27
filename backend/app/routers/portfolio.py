"""Portfolio & Recruiter Intelligence API."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.portfolio.proof_engine import ProjectEvidence, score_project, compute_portfolio_maturity
from app.services.portfolio.recruiter_engine import compute_recruiter_profile
from app.services.intelligence.orchestrator import run_intelligence_cycle
from app.services.execution import compute_execution_profile
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository

router = APIRouter(prefix="/v1/portfolio", tags=["Portfolio"])


class AddProjectRequest(BaseModel):
    project_name: str = Field(min_length=1)
    github_url: str | None = None
    live_url: str | None = None
    description: str | None = None
    stack: list[str] = []
    deployment_platform: str | None = None
    ci_cd_present: bool = False
    dockerized: bool = False
    cloud_services_used: list[str] = []
    ai_features_present: bool = False
    testing_present: bool = False
    documentation_score: int = Field(default=0, ge=0, le=10)
    architecture_complexity: str = "basic"


@router.post("/projects")
async def add_project(body: AddProjectRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    scores = score_project(body.model_dump())
    project = ProjectEvidence(
        user_id=current_user.id, **body.model_dump(),
        production_readiness_score=scores["production_readiness_score"],
        recruiter_signal_strength=scores["recruiter_signal_strength"],
    )
    db.add(project)
    await db.commit()
    return {"id": project.id, "production_readiness": scores["production_readiness_score"], "signal_strength": scores["recruiter_signal_strength"]}


@router.get("/projects")
async def list_projects(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectEvidence).where(ProjectEvidence.user_id == current_user.id).order_by(ProjectEvidence.created_at.desc()))
    projects = list(result.scalars().all())
    return {"projects": [{"id": p.id, "name": p.project_name, "stack": p.stack, "live_url": p.live_url, "production_readiness": p.production_readiness_score, "signal_strength": p.recruiter_signal_strength, "complexity": p.architecture_complexity} for p in projects]}


@router.get("/maturity")
async def get_portfolio_maturity(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectEvidence).where(ProjectEvidence.user_id == current_user.id))
    projects = [_project_to_dict(p) for p in result.scalars().all()]
    return compute_portfolio_maturity(projects)


@router.get("/recruiter-profile")
async def get_recruiter_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    intel = await run_intelligence_cycle(db, current_user.id)
    trajectory = intel["trajectory"]
    market = intel["market"]

    # Execution profile
    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(current_user.id)
    actions = await workspace_repo.get_actions(current_user.id)
    execution = compute_execution_profile(
        completed_nodes=(roadmap.completed_nodes or []) if roadmap else [],
        deferred_nodes=(roadmap.deferred_nodes or []) if roadmap else [],
        recommendation_actions=[{"action": a.action} for a in actions],
        operational_events=[], roadmap_version=roadmap.roadmap_version if roadmap else 0,
        growth_velocity=intel["summary"].get("competitiveness", 0),
        last_upload_at=None, last_activity_at=None,
    )

    # Portfolio projects
    result = await db.execute(select(ProjectEvidence).where(ProjectEvidence.user_id == current_user.id))
    projects = [_project_to_dict(p) for p in result.scalars().all()]

    user_skills = list(trajectory.get("specializations", {}).keys())
    profile = compute_recruiter_profile(trajectory=trajectory, execution_profile=execution, portfolio_projects=projects, market=market, user_skills=user_skills)
    return profile


def _project_to_dict(p: ProjectEvidence) -> dict:
    return {
        "project_name": p.project_name, "github_url": p.github_url, "live_url": p.live_url,
        "stack": p.stack, "deployment_platform": p.deployment_platform,
        "ci_cd_present": p.ci_cd_present, "dockerized": p.dockerized,
        "cloud_services_used": p.cloud_services_used, "ai_features_present": p.ai_features_present,
        "testing_present": p.testing_present, "documentation_score": p.documentation_score,
        "architecture_complexity": p.architecture_complexity,
    }
