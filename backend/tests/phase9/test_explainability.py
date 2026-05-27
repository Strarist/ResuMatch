import pytest
from app.services.explainability.logger import log_explanation
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_log_explanation():
    mock_session = AsyncMock()

    explanation = await log_explanation(
        session=mock_session,
        user_id="user-123",
        explanation_type="opportunity_expansion",
        source_domain="portfolio_maturity",
        affected_domain="recruiter_readiness",
        trigger_event="portfolio_scan",
        reasoning_summary="Docker maturity increased.",
        confidence_score="high",
        impact_delta="+10%"
    )

    assert explanation.user_id == "user-123"
    assert explanation.explanation_type == "opportunity_expansion"
    assert explanation.confidence_score == "high"
    mock_session.add.assert_called_once_with(explanation)
    mock_session.commit.assert_awaited_once()
