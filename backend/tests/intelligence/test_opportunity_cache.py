"""Tests for Redis-only opportunity job caching (no filesystem fallback)."""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.opportunity_engine import ingestion


@pytest.mark.asyncio
async def test_load_jobs_from_cache_redis_only():
    sample_jobs = [{"title": "Engineer", "url": "https://example.com/job/1"}]
    with patch("app.services.cache.cache_get", new_callable=AsyncMock, return_value=sample_jobs):
        jobs = await ingestion._load_jobs_from_cache()
    assert jobs == sample_jobs


@pytest.mark.asyncio
async def test_load_jobs_from_cache_returns_empty_when_redis_miss():
    with patch("app.services.cache.cache_get", new_callable=AsyncMock, return_value=None):
        jobs = await ingestion._load_jobs_from_cache()
    assert jobs == []


@pytest.mark.asyncio
async def test_save_jobs_to_cache_writes_redis_only():
    sample_jobs = [{"title": "Engineer", "url": "https://example.com/job/1"}]
    mock_set = AsyncMock()
    with patch("app.services.cache.cache_set", mock_set), patch("builtins.open") as mock_open:
        await ingestion._save_jobs_to_cache(sample_jobs)
    mock_set.assert_awaited_once()
    mock_open.assert_not_called()


@pytest.mark.asyncio
async def test_get_crawled_jobs_inner_uses_redis_without_filesystem():
    sample_jobs = [{"title": "Cached", "url": "https://example.com/cached"}]
    with patch.object(ingestion, "_load_jobs_from_cache", new_callable=AsyncMock, return_value=sample_jobs), patch(
        "os.path.exists"
    ) as mock_exists:
        jobs = await ingestion._get_crawled_jobs_inner()
    assert jobs == sample_jobs
    mock_exists.assert_not_called()
