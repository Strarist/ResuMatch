"""Market intelligence API."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.market_intelligence import compute_market_intelligence
from app.services.strategic_profile_service import get_profile_context
from app.services.cache import cache_get, cache_set

router = APIRouter(prefix="/v1/market-intelligence", tags=["Market Intelligence"])

_PENDING_MARKET_SNAPSHOT = {
    "status": "pending",
    "message": "Upload a resume or complete profile setup to calibrate market intelligence.",
    "skill_demand": [],
    "roi_skills": [],
    "recruiter_attractiveness": {
        "overall_score": 0.0,
        "portfolio_strength": 0.0,
        "stack_coherence": 0.0,
        "specialization_maturity": 0.0,
        "growth_signal": 0.0,
    },
    "salary_trajectory": {
        "seniority": "mid",
        "estimated_range": {"low": 0, "high": 0},
        "premium_factor": 0.0,
        "growth_potential": "low",
    },
    "high_value_missing": [],
    "curated_domain": {},
    "demand_graph": [],
}


@router.get("/snapshot")
async def get_market_intelligence(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"market_intelligence:snapshot:{current_user.id}"
    cached = await cache_get(cache_key)
    if cached:
        if "status" not in cached:
            cached = {**cached, "status": "ready"}
        return cached

    ctx = await get_profile_context(db, current_user.id)
    if not ctx["has_profile"]:
        return dict(_PENDING_MARKET_SNAPSHOT)

    result = compute_market_intelligence(
        user_skills=ctx["skills"],
        skill_confidences=ctx["skill_confidences"],
        target_role=ctx["target_role"],
        seniority=ctx["seniority"],
        growth_velocity=ctx["growth_velocity"],
    )
    result["status"] = "ready"
    await cache_set(cache_key, result, "medium")
    return result
