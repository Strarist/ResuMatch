"""Verify degraded opportunity feed does not substitute seed jobs."""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.opportunity_engine.ingestion import match_jobs_for_candidate


class _Profile:
    inferred_skills = ["Python", "FastAPI"]
    target_role = "Backend Engineer"
    active_specialization = "Backend"
    trajectory_state = {"years_of_experience": 5}


@pytest.mark.asyncio
@pytest.mark.critical
async def test_match_jobs_returns_degraded_empty_when_crawl_empty():
    with patch(
        "app.services.opportunity_engine.ingestion.get_crawled_jobs",
        new=AsyncMock(return_value=[]),
    ):
        result = await match_jobs_for_candidate(_Profile())

    assert result["matches"] == []
    assert result["degraded"] is True
    assert result["match_status"] == "degraded"
    assert "unavailable" in (result["message"] or "").lower()


@pytest.mark.asyncio
@pytest.mark.critical
async def test_match_jobs_returns_degraded_empty_on_pipeline_error():
    with patch(
        "app.services.opportunity_engine.ingestion.get_crawled_jobs",
        new=AsyncMock(side_effect=RuntimeError("provider down")),
    ):
        result = await match_jobs_for_candidate(_Profile())

    assert result["matches"] == []
    assert result["degraded"] is True
    assert result["match_status"] == "degraded"
