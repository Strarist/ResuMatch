"""Intelligence API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User
from app.services.intelligence import IntelligenceRepository

router = APIRouter(prefix="/v1/intelligence", tags=["Intelligence"])


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
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "payload": e.structured_payload,
                "created_at": e.created_at,
            }
            for e in events
        ]
    }
