"""Intelligence API endpoints — includes unified orchestrator endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.intelligence import IntelligenceRepository
from app.services.intelligence.orchestrator import run_intelligence_cycle, get_intelligence_summary_readonly

router = APIRouter(prefix="/v1/intelligence", tags=["Intelligence"])


@router.get("/summary")
async def get_unified_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unified intelligence summary — orchestrates all engines."""
    result = await get_intelligence_summary_readonly(db, current_user.id)
    return result["summary"]


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Strategic recommendations from all intelligence signals."""
    result = await get_intelligence_summary_readonly(db, current_user.id)
    return {"recommendations": result["recommendations"]}


@router.get("/feed")
async def get_intelligence_feed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Chronological intelligence feed aggregating all engines."""
    repo = IntelligenceRepository(db)
    from app.services.trajectory import TrajectoryRepository
    from app.services.roadmap_intel import RoadmapRepository

    traj_repo = TrajectoryRepository(db)
    roadmap_repo = RoadmapRepository(db)

    # Gather events from all engines
    memory_events = await repo.get_timeline(current_user.id, limit=20)
    traj_events = await traj_repo.get_timeline(current_user.id, limit=10)
    roadmap_events = await roadmap_repo.get_timeline(current_user.id, limit=10)

    # Merge and sort chronologically
    feed = []
    for e in memory_events:
        feed.append({"source": "memory", "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at})
    for e in traj_events:
        feed.append({"source": "trajectory", "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at})
    for e in roadmap_events:
        feed.append({"source": "roadmap", "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at})

    feed.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return {"feed": feed[:30]}


@router.post("/recompute")
async def recompute_intelligence(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Force full intelligence recomputation."""
    result = await run_intelligence_cycle(db, current_user.id)

    from app.services.execution import compute_execution_profile
    from app.services.roadmap_intel import RoadmapRepository
    from app.services.workspace import WorkspaceRepository
    from app.services.user_progress_service import track_score_update

    roadmap_repo = RoadmapRepository(db)
    workspace_repo = WorkspaceRepository(db)
    roadmap = await roadmap_repo.get_active(current_user.id)
    actions = await workspace_repo.get_actions(current_user.id)
    execution = compute_execution_profile(
        completed_nodes=(roadmap.completed_nodes or []) if roadmap else [],
        deferred_nodes=(roadmap.deferred_nodes or []) if roadmap else [],
        recommendation_actions=[{"action": a.action, "type": a.recommendation_type} for a in actions],
        operational_events=[],
        roadmap_version=roadmap.roadmap_version if roadmap else 0,
        growth_velocity=result["summary"].get("competitiveness", 0),
        last_upload_at=None,
        last_activity_at=roadmap.updated_at.isoformat() if roadmap and roadmap.updated_at else None,
    )
    await track_score_update(
        db,
        current_user.id,
        recruiter_score=execution.get("growth_velocity", 0.8) * 100,
        market_readiness=result["summary"].get("competitiveness", 0.75) * 100,
        specialization=result["summary"].get("dominant_path", "General Software Engineering"),
    )
    await db.commit()
    return {
        "message": "Intelligence recomputed",
        "summary": result["summary"],
        "recommendations_count": len(result["recommendations"]),
    }


@router.get("/profile")
async def get_intelligence_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deprecated legacy shape — prefer GET /v1/strategic/profile."""
    from app.services.strategic_profile_service import get_profile_context

    ctx = await get_profile_context(db, current_user.id)
    if ctx["has_profile"] and ctx["profile"]:
        profile = ctx["profile"]
        return {
            "user_id": str(current_user.id),
            "source": "strategic_profile",
            "inferred_seniority": ctx["seniority"],
            "preferred_roles": [profile.target_role] if profile.target_role else [],
            "preferred_domains": ctx["preferred_domains"],
            "strongest_skill_clusters": ctx["skills"][:5],
            "growth_velocity": ctx["growth_velocity"],
            "resume_version_count": 1,
            "confidence_snapshot": ctx["skill_confidences"],
            "last_analysis_at": profile.updated_at,
        }

    repo = IntelligenceRepository(db)
    profile = await repo.get_or_create_career_profile(current_user.id)
    return {
        "user_id": str(current_user.id),
        "source": "legacy",
        "inferred_seniority": profile.inferred_seniority,
        "preferred_roles": profile.preferred_roles,
        "preferred_domains": profile.preferred_domains,
        "strongest_skill_clusters": profile.strongest_skill_clusters,
        "growth_velocity": profile.growth_velocity,
        "resume_version_count": profile.resume_version_count,
        "confidence_snapshot": profile.confidence_snapshot,
        "last_analysis_at": profile.last_analysis_at,
    }


@router.get("/skills")
async def get_intelligence_skills(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deprecated legacy shape — prefer GET /v1/strategic/profile."""
    from app.services.strategic_profile_service import get_profile_context

    ctx = await get_profile_context(db, current_user.id)
    if ctx["has_profile"]:
        return {
            "source": "strategic_profile",
            "skills": [
                {
                    "skill": skill,
                    "confidence": round(ctx["skill_confidences"].get(skill, 0.9), 3),
                    "proficiency": 0.85,
                    "occurrences": 1,
                    "first_seen": None,
                    "last_seen": None,
                }
                for skill in ctx["skills"]
            ],
        }

    repo = IntelligenceRepository(db)
    skills = await repo.get_user_skills(current_user.id)
    return {
        "source": "legacy",
        "skills": [
            {
                "skill": s.normalized_skill,
                "confidence": round(s.confidence_score, 3),
                "proficiency": round(s.proficiency_estimate, 3),
                "occurrences": s.occurrence_count,
                "first_seen": s.first_seen_at,
                "last_seen": s.last_seen_at,
            }
            for s in skills
        ],
    }


@router.get("/timeline")
async def get_intelligence_timeline(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = IntelligenceRepository(db)
    events = await repo.get_timeline(current_user.id, limit=50)
    return {
        "events": [
            {"id": str(e.id), "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at}
            for e in events
        ]
    }
