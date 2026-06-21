"""Integration tests — API responses include explicit trust metadata."""

import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app
from app.models.strategic_profile import StrategicProfile


async def _register_and_login(client: AsyncClient) -> tuple[dict[str, str], str]:
    email = f"trust-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    await client.post(
        "/v1/auth/register",
        json={"name": "Trust Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    body = login.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


@pytest.mark.asyncio
async def test_opportunity_matches_include_trust_fields(test_engine):
    from app.db import async_session_factory

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _register_and_login(client)

        async with async_session_factory() as db:
            profile = StrategicProfile(
                user_id=user_id,
                inferred_skills=["Python", "FastAPI"],
                target_role="Backend Engineer",
                opportunity_alignment=[
                    {
                        "title": "Platform Engineer",
                        "company": "Acme",
                        "alignment_score": 85,
                        "confidence": 0.9,
                    }
                ],
            )
            db.add(profile)
            await db.commit()

        resp = await client.get("/v1/opportunities/matches", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ready"
        assert len(body["matches"]) >= 1
        match = body["matches"][0]
        assert "source" in match
        assert "status" in match
        assert "match_reason" in match
        assert isinstance(match["match_reason"], list)


@pytest.mark.asyncio
async def test_market_snapshot_pending_without_profile(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = (await _register_and_login(client))[0]
        resp = await client.get("/v1/market-intelligence/snapshot", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "pending"
        assert body["skill_demand"] == []


@pytest.mark.asyncio
async def test_market_snapshot_ready_with_profile(test_engine):
    from app.db import async_session_factory

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _register_and_login(client)

        async with async_session_factory() as db:
            profile = StrategicProfile(
                user_id=user_id,
                inferred_skills=["Python", "React"],
                target_role="Full Stack Engineer",
                trajectory_state={"competitiveness_score": 0.75},
            )
            db.add(profile)
            await db.commit()

        resp = await client.get("/v1/market-intelligence/snapshot", headers=headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ready"
        assert len(body["skill_demand"]) > 0
