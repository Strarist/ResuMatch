"""Integration tests — GET endpoints must not trigger full intelligence recompute or commits."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import func, select

from app.main import app as fastapi_app
from app.services.trajectory.models import CareerTrajectorySnapshot


async def _register_and_login(client: AsyncClient) -> dict[str, str]:
    email = f"read-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    await client.post(
        "/v1/auth/register",
        json={"name": "Read Semantics", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
@patch("app.services.intelligence.orchestrator.run_intelligence_cycle", new_callable=AsyncMock)
async def test_progress_snapshot_does_not_full_recompute(mock_cycle, test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/progress/snapshot", headers=headers)
        assert resp.status_code == 200
        assert "execution" in resp.json()
        mock_cycle.assert_not_called()


@pytest.mark.asyncio
@patch("app.services.intelligence.orchestrator.run_intelligence_cycle", new_callable=AsyncMock)
async def test_portfolio_recruiter_profile_does_not_full_recompute(mock_cycle, test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/portfolio/recruiter-profile", headers=headers)
        assert resp.status_code == 200
        mock_cycle.assert_not_called()


@pytest.mark.asyncio
async def test_trajectory_snapshot_does_not_persist_on_get(test_engine):
    from app.db import async_session_factory

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)

        async with async_session_factory() as db:
            before = await db.scalar(select(func.count()).select_from(CareerTrajectorySnapshot))

        resp = await client.get("/v1/trajectory/snapshot", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "dominant_path" in body

        async with async_session_factory() as db:
            after = await db.scalar(select(func.count()).select_from(CareerTrajectorySnapshot))
        assert after == before


@pytest.mark.asyncio
@patch("app.services.opportunity_engine.ingestion.match_jobs_for_candidate", new_callable=AsyncMock)
async def test_opportunities_matches_does_not_crawl_on_get(mock_match, test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/opportunities/matches", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "matches" in data
        mock_match.assert_not_called()


@pytest.mark.asyncio
async def test_opportunities_matches_pending_when_no_profile(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/opportunities/matches", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("matches") == []


@pytest.mark.asyncio
@patch("app.routers.workspace.generate_copilot_response", new_callable=AsyncMock, return_value="Test copilot reply")
@patch("app.services.intelligence.orchestrator.run_intelligence_cycle", new_callable=AsyncMock)
async def test_workspace_message_does_not_full_recompute(mock_cycle, mock_copilot, test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        session_resp = await client.post(
            "/v1/workspace/session",
            headers=headers,
            json={"title": "Test Session", "session_type": "copilot"},
        )
        assert session_resp.status_code == 200
        session_id = session_resp.json()["id"]

        msg_resp = await client.post(
            f"/v1/workspace/session/{session_id}/message",
            headers=headers,
            json={"content": "What should I focus on next?"},
        )
        assert msg_resp.status_code == 200
        assert msg_resp.json()["message"]["content"] == "Test copilot reply"
        mock_cycle.assert_not_called()
        mock_copilot.assert_called_once()
