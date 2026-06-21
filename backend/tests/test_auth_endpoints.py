"""Integration tests for auth endpoints."""

import uuid
from unittest.mock import patch

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app


@pytest.mark.asyncio
async def test_auth_register_login_profile_refresh_logout(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        email = f"auth-{uuid.uuid4().hex[:8]}@example.com"
        password = "StrongPass123!"

        register_resp = await client.post(
            "/v1/auth/register",
            json={"name": "Auth Test", "email": email, "password": password},
        )
        assert register_resp.status_code == 200
        register_data = register_resp.json()
        assert register_data["access_token"]
        assert register_data["user"]["email"] == email

        login_resp = await client.post(
            "/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        profile_resp = await client.get(
            "/v1/auth/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert profile_resp.status_code == 200
        assert profile_resp.json()["user"]["email"] == email

        refresh_resp = await client.post(
            "/v1/auth/refresh",
            cookies=login_resp.cookies,
        )
        assert refresh_resp.status_code == 200
        assert refresh_resp.json()["message"] == "Token refreshed"
        assert "access_token" in refresh_resp.cookies

        logout_resp = await client.post(
            "/v1/auth/logout",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert logout_resp.status_code == 200


@pytest.mark.asyncio
async def test_auth_login_invalid_credentials(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        resp = await client.post(
            "/v1/auth/login",
            json={"email": "nobody@example.com", "password": "WrongPass123!"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_google_oauth_not_configured_returns_503(test_engine):
    """Documents expected failure when Google OAuth creds are absent.

    Full OAuth callback E2E requires live Google credentials — manual checklist only.
    """
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        with patch("app.routers.auth.settings.google_client_id", ""), patch(
            "app.routers.auth.settings.google_client_secret", ""
        ):
            resp = await client.get("/v1/auth/google/login")
        assert resp.status_code == 503
        body = resp.json()
        assert body["error"] == "oauth_not_configured"
