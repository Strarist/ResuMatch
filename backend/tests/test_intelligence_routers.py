"""Integration tests for strategic, roadmap-intel, and market intelligence endpoints."""

import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app


async def _register_and_login(client: AsyncClient) -> dict[str, str]:
    email = f"intel-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    await client.post(
        "/v1/auth/register",
        json={"name": "Intel Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_strategic_profile_and_focus(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)

        profile = await client.get("/v1/strategic/profile", headers=headers)
        assert profile.status_code == 200
        assert "skills" in profile.json()

        focus = await client.get("/v1/strategic/focus", headers=headers)
        assert focus.status_code == 200
        data = focus.json()
        assert "focus" in data
        assert "plan" in data


@pytest.mark.asyncio
async def test_strategic_lifecycle(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/strategic/lifecycle", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["has_strategic_profile"] is False
        assert data["resume_parse_status"] == "none"
        assert data["lifecycle_stage"] == 1


@pytest.mark.asyncio
async def test_roadmap_intel_state(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/roadmap-intel/state", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "state" in body or "roadmap" in body or body.get("state") is None


@pytest.mark.asyncio
async def test_market_intelligence_snapshot(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        resp = await client.get("/v1/market-intelligence/snapshot", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "pending"
        assert data["skill_demand"] == []
