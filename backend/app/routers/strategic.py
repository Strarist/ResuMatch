"""Strategic Focus API — unified prioritization and execution planning."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.intelligence.orchestrator import run_intelligence_cycle
from app.services.execution import compute_execution_profile
from app.services.risk import compute_career_risks
from app.services.prioritization import compute_strategic_focus
from app.services.planning import generate_execution_plan
from app.services.roadmap_intel import RoadmapRepository
from app.services.workspace import WorkspaceRepository

router = APIRouter(prefix="/v1/strategic", tags=["Strategic"])


@router.get("/focus")
async def get_strategic_focus(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full strategic focus profile: prioritization + execution plan."""
    intel = await run_intelligence_cycle(db, current_user.id)
    summary = intel["summary"]
    trajectory = intel["trajectory"]
    market = intel["market"]
    recommendations = intel["recommendations"]

    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(current_user.id)
    actions = await workspace_repo.get_actions(current_user.id)

    completed = (roadmap.completed_nodes or []) if roadmap else []
    deferred = (roadmap.deferred_nodes or []) if roadmap else []
    action_dicts = [{"action": a.action, "type": a.recommendation_type} for a in actions]

    # Execution profile
    execution = compute_execution_profile(
        completed_nodes=completed, deferred_nodes=deferred,
        recommendation_actions=action_dicts, operational_events=[],
        roadmap_version=roadmap.roadmap_version if roadmap else 0,
        growth_velocity=summary.get("competitiveness", 0),
        last_upload_at=None,
        last_activity_at=roadmap.updated_at.isoformat() if roadmap and roadmap.updated_at else None,
    )

    # Risks
    risks = compute_career_risks(execution_profile=execution, trajectory=trajectory, market=market, user_skills=list(trajectory.get("specializations", {}).keys()))

    # Strategic focus
    focus = compute_strategic_focus(
        execution_profile=execution, trajectory=trajectory, market=market,
        risks=risks, roadmap_state=roadmap, recommendations=recommendations,
    )

    # Execution plan
    plan = generate_execution_plan(focus_profile=focus, execution_profile=execution, roadmap_state=roadmap, market=market)

    return {
        "focus": focus,
        "plan": plan,
        "execution": execution,
        "risks": {"risk_score": risks["risk_score"], "count": risks["risk_count"]},
    }
