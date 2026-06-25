"""Roadmap intelligence mutation smoke tests."""

import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app


async def _register_and_login(client: AsyncClient) -> dict[str, str]:
    email = f"road-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"  # pragma: allowlist secret
    await client.post(
        "/v1/auth/register",
        json={"name": "Roadmap Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_roadmap_and_complete_node(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)

        state_resp = await client.get("/v1/roadmap-intel/state", headers=headers)
        assert state_resp.status_code == 200
        assert state_resp.json()["state"] is None

        create_resp = await client.post(
            "/v1/roadmap-intel/create",
            headers=headers,
            json={
                "target_role": "Senior Backend Engineer",
                "target_skills": ["Python", "PostgreSQL", "Kubernetes", "System Design"],
            },
        )
        assert create_resp.status_code == 200
        snapshot = create_resp.json()["state"]["snapshot"]
        milestones = snapshot.get("milestones") or []
        assert len(milestones) >= 1
        skill = milestones[0]["skill"]

        complete_resp = await client.post(
            "/v1/roadmap-intel/node/complete",
            headers=headers,
            json={"skill": skill},
        )
        assert complete_resp.status_code == 200

        state_resp2 = await client.get("/v1/roadmap-intel/state", headers=headers)
        completed = state_resp2.json()["state"]["completed_nodes"]
        assert skill in completed


@pytest.mark.asyncio
async def test_mutate_roadmap_returns_focus_areas(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)

        await client.post(
            "/v1/roadmap-intel/create",
            headers=headers,
            json={"target_role": "Data Engineer", "target_skills": ["Python", "Spark", "SQL", "Airflow"]},
        )

        mutate_resp = await client.post(
            "/v1/roadmap-intel/mutate",
            headers=headers,
            json={"target_skills": ["Python", "Spark", "SQL", "Airflow", "dbt"]},
        )
        assert mutate_resp.status_code == 200
        body = mutate_resp.json()
        assert "mutations" in body
        assert "snapshot" in body
