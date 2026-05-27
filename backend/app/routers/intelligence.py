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
    repo = IntelligenceRepository(db)
    profile = await repo.get_or_create_career_profile(current_user.id)
    return {
        "user_id": str(current_user.id),
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
    repo = IntelligenceRepository(db)
    skills = await repo.get_user_skills(current_user.id)
    return {
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
        ]
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
