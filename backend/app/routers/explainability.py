from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.memory import IntelligenceExplanation
from app.services.prioritization.v2_engine import get_strategic_priorities
from app.services.opportunity_reasoning.engine import generate_opportunity_reasoning

router = APIRouter(prefix="/v1/intelligence", tags=["intelligence_v2"])

@router.get("/explanations")
async def get_explanations(
    limit: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(IntelligenceExplanation)
        .where(IntelligenceExplanation.user_id == user.id)
        .order_by(desc(IntelligenceExplanation.created_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    explanations = result.scalars().all()

    # If empty, return a mocked list for Phase 9.2 UX demonstration
    if not explanations:
        return [
            {
                "id": "mock-1",
                "explanation_type": "opportunity_expansion",
                "source_domain": "portfolio_maturity",
                "affected_domain": "roadmap_intensity",
                "trigger_event": "portfolio_scan",
                "reasoning_summary": "Docker maturity crossed threshold. CI/CD evidence improved.",
                "confidence_score": "high",
                "impact_delta": "+12%",
                "created_at": "2026-05-26T10:00:00Z"
            },
            {
                "id": "mock-2",
                "explanation_type": "recruiter_confidence",
                "source_domain": "execution_velocity",
                "affected_domain": "recruiter_readiness",
                "trigger_event": "consistency_check",
                "reasoning_summary": "Recruiter readiness improved because execution consistency stabilized.",
                "confidence_score": "medium",
                "impact_delta": "+8%",
                "created_at": "2026-05-25T14:30:00Z"
            }
        ]

    return explanations

@router.get("/strategic-priorities")
async def get_priorities(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return get_strategic_priorities({})

@router.get("/opportunity-reasoning")
async def get_opp_reasoning(
    role: str = "Infrastructure AI Engineer",
    user: User = Depends(get_current_user)
):
    return generate_opportunity_reasoning(role, {})
