"""Explainability Core Engine."""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.memory import IntelligenceExplanation
from loguru import logger

async def log_explanation(
    session: AsyncSession,
    user_id: str,
    explanation_type: str,
    source_domain: str,
    affected_domain: str,
    trigger_event: str,
    reasoning_summary: str,
    confidence_score: str,
    impact_delta: str = None
) -> IntelligenceExplanation:
    """Persist an intelligence explanation to trace adaptive logic."""
    explanation = IntelligenceExplanation(
        user_id=user_id,
        explanation_type=explanation_type,
        source_domain=source_domain,
        affected_domain=affected_domain,
        trigger_event=trigger_event,
        reasoning_summary=reasoning_summary,
        confidence_score=confidence_score,
        impact_delta=impact_delta
    )
    session.add(explanation)
    await session.commit()
    await session.refresh(explanation)
    logger.info(f"Explainability Engine: Logged {explanation_type} for user {user_id}")
    return explanation
