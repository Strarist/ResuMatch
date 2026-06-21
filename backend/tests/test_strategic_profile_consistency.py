"""Integration tests — StrategicProfile is canonical across product routers."""

import uuid

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import func, select

from app.main import app as fastapi_app
from app.models.strategic_profile import StrategicProfile
from app.services.intelligence.intelligence_models import UserSkillProfile
from app.services.strategic_profile_service import (
    sync_legacy_intelligence_from_profile,
    sync_legacy_roadmap_from_profile,
)


async def _register_and_login(client: AsyncClient) -> tuple[dict[str, str], str]:
    email = f"sp-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    await client.post(
        "/v1/auth/register",
        json={"name": "SP Consistency", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    body = login.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


def _sample_profile(user_id: str) -> StrategicProfile:
    return StrategicProfile(
        user_id=user_id,
        inferred_skills=["Python", "FastAPI", "React"],
        active_specialization="Full Stack Engineering",
        target_role="Senior Full Stack Engineer",
        roadmap_progress={"completedPercent": 0, "completedCount": 0, "totalCount": 3},
        opportunity_alignment=[
            {
                "title": "Platform Engineer",
                "company": "Acme",
                "alignment_score": 88,
                "status": "ready",
            }
        ],
        market_alignment=82.0,
        trajectory_state={
            "dominant_path": "Full Stack Engineering",
            "competitiveness_score": 0.82,
            "confidence": 0.85,
            "readiness_scores": {},
            "secondary_paths": [],
            "adjacent_roles": ["Backend Engineer"],
        },
        ai_recommendations=[{"priority": "high", "title": "Learn Kubernetes", "explanation": "Gap fill"}],
    )


@pytest.mark.asyncio
async def test_cross_router_consistency_after_profile_seed(test_engine):
    from app.db import async_session_factory

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _register_and_login(client)

        async with async_session_factory() as db:
            profile = _sample_profile(user_id)
            db.add(profile)
            await db.flush()
            await sync_legacy_intelligence_from_profile(db, user_id, profile)
            await sync_legacy_roadmap_from_profile(
                db,
                user_id,
                profile,
                milestones=[{"skill": "Kubernetes", "priority": "high"}],
                focus_areas=["Kubernetes"],
            )
            await db.commit()

        strategic = await client.get("/v1/strategic/profile", headers=headers)
        assert strategic.status_code == 200
        sp_body = strategic.json()
        assert sp_body["target_role"] == "Senior Full Stack Engineer"
        skill_names = {s["name"] if isinstance(s, dict) else s for s in sp_body["skills"]}
        assert "Python" in skill_names

        matches = await client.get("/v1/opportunities/matches", headers=headers)
        assert matches.status_code == 200
        match_body = matches.json()
        assert match_body["status"] == "ready"
        assert len(match_body["matches"]) >= 1

        market = await client.get("/v1/market-intelligence/snapshot", headers=headers)
        assert market.status_code == 200
        market_body = market.json()
        assert market_body["status"] == "ready"
        market_skills = {item["skill"].lower() for item in market_body["skill_demand"]}
        assert "python" in market_skills

        roadmap = await client.get("/v1/roadmap-intel/state", headers=headers)
        assert roadmap.status_code == 200
        state = roadmap.json()["state"]
        assert state is not None
        assert state["target_role"] == "Senior Full Stack Engineer"


@pytest.mark.asyncio
async def test_sp_preferred_read_without_legacy_skills(test_engine):
    from app.db import async_session_factory

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _register_and_login(client)

        async with async_session_factory() as db:
            profile = _sample_profile(user_id)
            db.add(profile)
            await db.commit()

        skills_resp = await client.get("/v1/intelligence/skills", headers=headers)
        assert skills_resp.status_code == 200
        skills_body = skills_resp.json()
        assert skills_body["source"] == "strategic_profile"
        skill_names = {s["skill"] for s in skills_body["skills"]}
        assert "Python" in skill_names

        market = await client.get("/v1/market-intelligence/snapshot", headers=headers)
        assert market.status_code == 200
        assert market.json()["status"] == "ready"


@pytest.mark.asyncio
async def test_legacy_sync_idempotent(test_engine):
    from app.db import async_session_factory

    user_id = str(uuid.uuid4())
    profile = _sample_profile(user_id)

    async with async_session_factory() as db:
        db.add(profile)
        await db.flush()
        await sync_legacy_intelligence_from_profile(db, user_id, profile)
        await sync_legacy_intelligence_from_profile(db, user_id, profile)
        await db.commit()

    async with async_session_factory() as db:
        count = await db.scalar(
            select(func.count())
            .select_from(UserSkillProfile)
            .where(UserSkillProfile.user_id == user_id)
        )
        assert count == len(profile.inferred_skills)
