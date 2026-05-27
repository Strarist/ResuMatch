"""Market intelligence API."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.intelligence.intelligence_repository import IntelligenceRepository
from app.services.roadmap_intel.roadmap_repository import RoadmapRepository
from app.services.market_intelligence import compute_market_intelligence

router = APIRouter(prefix="/v1/market-intelligence", tags=["Market Intelligence"])


@router.get("/snapshot")
async def get_market_intelligence(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    intel_repo = IntelligenceRepository(db)
    roadmap_repo = RoadmapRepository(db)

    skills_db = await intel_repo.get_user_skills(current_user.id)
    profile = await intel_repo.get_or_create_career_profile(current_user.id)
    roadmap = await roadmap_repo.get_active(current_user.id)

    user_skills = [s.normalized_skill for s in skills_db]
    confidences = {s.normalized_skill: s.confidence_score for s in skills_db}
    target_role = roadmap.target_role if roadmap else None

    result = compute_market_intelligence(
        user_skills=user_skills,
        skill_confidences=confidences,
        target_role=target_role,
        seniority=profile.inferred_seniority or "mid",
        growth_velocity=profile.growth_velocity or 0.0,
    )
    return result
