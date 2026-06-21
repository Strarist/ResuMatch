"""Performance baseline regression tests — warm-path latency budgets."""

import time
import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app

# Budgets in seconds (generous for CI/dev machines; tighten over time)
MATCHES_BUDGET_SEC = 2.0
FOCUS_BUDGET_SEC = 2.0
PROGRESS_BUDGET_SEC = 2.0
MARKET_SNAPSHOT_BUDGET_SEC = 2.0
STRATEGIC_PROFILE_BUDGET_SEC = 2.0


async def _register_and_login(client: AsyncClient) -> dict[str, str]:
    email = f"perf-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    await client.post(
        "/v1/auth/register",
        json={"name": "Perf Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_opportunities_matches_warm_path_under_budget(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        # Prime cache / pending response
        await client.get("/v1/opportunities/matches", headers=headers)
        start = time.perf_counter()
        resp = await client.get("/v1/opportunities/matches", headers=headers)
        elapsed = time.perf_counter() - start
        assert resp.status_code == 200
        assert elapsed < MATCHES_BUDGET_SEC, f"matches GET took {elapsed:.2f}s (budget {MATCHES_BUDGET_SEC}s)"


@pytest.mark.asyncio
async def test_strategic_focus_under_budget(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        start = time.perf_counter()
        resp = await client.get("/v1/strategic/focus", headers=headers)
        elapsed = time.perf_counter() - start
        assert resp.status_code == 200
        assert elapsed < FOCUS_BUDGET_SEC, f"focus GET took {elapsed:.2f}s (budget {FOCUS_BUDGET_SEC}s)"


@pytest.mark.asyncio
async def test_progress_snapshot_under_budget(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        start = time.perf_counter()
        resp = await client.get("/v1/progress/snapshot", headers=headers)
        elapsed = time.perf_counter() - start
        assert resp.status_code == 200
        assert elapsed < PROGRESS_BUDGET_SEC, f"progress GET took {elapsed:.2f}s (budget {PROGRESS_BUDGET_SEC}s)"


@pytest.mark.asyncio
async def test_market_snapshot_warm_path_under_budget(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        await client.get("/v1/market-intelligence/snapshot", headers=headers)
        start = time.perf_counter()
        resp = await client.get("/v1/market-intelligence/snapshot", headers=headers)
        elapsed = time.perf_counter() - start
        assert resp.status_code == 200
        assert elapsed < MARKET_SNAPSHOT_BUDGET_SEC, (
            f"market snapshot GET took {elapsed:.2f}s (budget {MARKET_SNAPSHOT_BUDGET_SEC}s)"
        )


@pytest.mark.asyncio
async def test_strategic_profile_under_budget(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        start = time.perf_counter()
        resp = await client.get("/v1/strategic/profile", headers=headers)
        elapsed = time.perf_counter() - start
        assert resp.status_code == 200
        assert elapsed < STRATEGIC_PROFILE_BUDGET_SEC, (
            f"strategic profile GET took {elapsed:.2f}s (budget {STRATEGIC_PROFILE_BUDGET_SEC}s)"
        )
