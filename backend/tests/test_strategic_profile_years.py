"""Tests for strategic profile years_of_experience persistence."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.main import app as fastapi_app
from app.models.strategic_profile import StrategicProfile
from app.routers.strategic import _resolve_years_of_experience


def test_resolve_years_of_experience_uses_stored_value():
    state = {"competitiveness_score": 0.555, "years_of_experience": 6.0}
    assert _resolve_years_of_experience(state) == 6.0


def test_resolve_years_of_experience_ignores_competitiveness_proxy():
    state = {"competitiveness_score": 0.555}
    assert _resolve_years_of_experience(state) == 5.0


async def _register_and_login(client: AsyncClient) -> tuple[dict[str, str], str]:
    email = f"years-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"  # pragma: allowlist secret
    await client.post(
        "/v1/auth/register",
        json={"name": "Years Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    body = login.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


@pytest.mark.asyncio
async def test_get_profile_uses_stored_years_not_competitiveness(test_engine):
    from app.db import async_session_factory

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _register_and_login(client)

        async with async_session_factory() as db:
            profile = StrategicProfile(
                user_id=user_id,
                inferred_skills=["Python", "FastAPI"],
                active_specialization="Backend",
                target_role="Backend Engineer",
                roadmap_progress={"completedPercent": 0, "completedCount": 0, "totalCount": 2},
                opportunity_alignment=[],
                market_alignment=55.0,
                trajectory_state={
                    "competitiveness_score": 0.555,
                    "years_of_experience": 6.0,
                    "skill_origins": {"Python": "resume", "FastAPI": "resume"},
                },
            )
            db.add(profile)
            await db.commit()

        resp = await client.get("/v1/strategic/profile", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["years_of_experience"] == 6.0
        assert data["years_of_experience"] != pytest.approx(5.55, abs=0.01)


@pytest.mark.asyncio
async def test_profile_update_persists_years_of_experience(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _register_and_login(client)

        payload = {
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "target_role": "Backend Engineer",
            "specialization": "Backend",
            "years_of_experience": 7.5,
        }

        with patch(
            "app.services.llm.generators.generate_adaptive_roadmap",
            new_callable=AsyncMock,
            return_value=[{"skill": "Kubernetes", "priority": "high"}],
        ), patch(
            "app.services.opportunity_engine.ingestion.match_jobs_for_candidate",
            new_callable=AsyncMock,
            return_value={"matches": [], "degraded": False, "message": None, "match_status": "ready"},
        ):
            update = await client.post("/v1/strategic/profile/update", json=payload, headers=headers)
            assert update.status_code == 200

        get_resp = await client.get("/v1/strategic/profile", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["years_of_experience"] == 7.5

        from app.db import async_session_factory

        async with async_session_factory() as db:
            result = await db.execute(
                select(StrategicProfile).where(StrategicProfile.user_id == user_id)
            )
            profile = result.scalar_one()
            assert profile.trajectory_state["years_of_experience"] == 7.5
