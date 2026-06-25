"""Workspace session CRUD and message persistence integration tests."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app


async def _register_and_login(client: AsyncClient) -> dict[str, str]:
    email = f"ws-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"  # pragma: allowlist secret
    await client.post(
        "/v1/auth/register",
        json={"name": "Workspace Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
@pytest.mark.critical
async def test_list_and_create_sessions(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)

        list_resp = await client.get("/v1/workspace/sessions", headers=headers)
        assert list_resp.status_code == 200
        assert list_resp.json()["sessions"] == []

        create_resp = await client.post(
            "/v1/workspace/session",
            headers=headers,
            json={"title": "Career chat", "session_type": "copilot"},
        )
        assert create_resp.status_code == 200
        session_id = create_resp.json()["id"]

        list_resp2 = await client.get("/v1/workspace/sessions", headers=headers)
        sessions = list_resp2.json()["sessions"]
        assert len(sessions) == 1
        assert sessions[0]["id"] == session_id
        assert sessions[0]["title"] == "Career chat"


@pytest.mark.asyncio
@patch("app.routers.workspace.generate_copilot_response", new_callable=AsyncMock, return_value="Assistant reply")
async def test_send_message_persists_user_and_assistant(_mock_copilot, test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        session_resp = await client.post(
            "/v1/workspace/session",
            headers=headers,
            json={"title": "Msg test", "session_type": "copilot"},
        )
        session_id = session_resp.json()["id"]

        msg_resp = await client.post(
            f"/v1/workspace/session/{session_id}/message",
            headers=headers,
            json={"content": "What skills should I prioritize?"},
        )
        assert msg_resp.status_code == 200
        assert msg_resp.json()["message"]["role"] == "assistant"

        get_resp = await client.get(f"/v1/workspace/session/{session_id}", headers=headers)
        messages = get_resp.json()["messages"]
        assert len(messages) == 2
        assert messages[0]["role"] == "user"
        assert messages[1]["role"] == "assistant"


@pytest.mark.asyncio
async def test_patch_and_delete_session(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _register_and_login(client)
        session_resp = await client.post(
            "/v1/workspace/session",
            headers=headers,
            json={"title": "Rename me", "session_type": "copilot"},
        )
        session_id = session_resp.json()["id"]

        patch_resp = await client.patch(
            f"/v1/workspace/session/{session_id}",
            headers=headers,
            json={"title": "Pinned chat", "pinned": True},
        )
        assert patch_resp.status_code == 200
        body = patch_resp.json()
        assert body["title"] == "Pinned chat"
        assert body["pinned"] is True

        delete_resp = await client.delete(f"/v1/workspace/session/{session_id}", headers=headers)
        assert delete_resp.status_code == 200

        list_resp = await client.get("/v1/workspace/sessions", headers=headers)
        assert list_resp.json()["sessions"] == []


@pytest.mark.asyncio
@patch("app.services.market_intelligence.compute_market_intelligence")
async def test_copilot_market_snapshot_cached_per_user(mock_compute, test_engine):
    from app.services.workspace.copilot import _get_market_snapshot_for_copilot

    mock_compute.return_value = {"salary_trajectory": {"estimated_range": {"low": 1, "high": 2}}, "curated_domain": {}, "demand_graph": {}}

    snap1 = await _get_market_snapshot_for_copilot("user-1", ["Python"], {"Python": 0.9}, "Engineer", "mid")
    snap2 = await _get_market_snapshot_for_copilot("user-1", ["Python"], {"Python": 0.9}, "Engineer", "mid")

    assert snap1 == snap2
    mock_compute.assert_called_once()
