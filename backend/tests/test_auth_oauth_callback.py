"""OAuth callback redirect tests with mocked Authlib exchange."""

import os
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app as fastapi_app


@pytest.mark.asyncio
async def test_google_callback_redirects_on_oauth_error(test_engine):
    from authlib.integrations.starlette_client import OAuthError

    os.environ["GOOGLE_CLIENT_ID"] = "test-client-id"
    os.environ["GOOGLE_CLIENT_SECRET"] = "test-client-secret"  # pragma: allowlist secret
    from app.config import get_settings
    get_settings.cache_clear()

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        with patch("app.routers.auth.oauth.google.authorize_access_token", new_callable=AsyncMock) as mock_token:
            mock_token.side_effect = OAuthError(error="access_denied")
            resp = await client.get(
                "/v1/auth/google/callback",
                follow_redirects=False,
            )
    assert resp.status_code in (302, 307)
    assert "error=oauth_failed" in resp.headers.get("location", "")


@pytest.mark.asyncio
async def test_google_login_redirect_when_configured(test_engine):
    os.environ["GOOGLE_CLIENT_ID"] = "test-client-id"
    os.environ["GOOGLE_CLIENT_SECRET"] = "test-client-secret"  # pragma: allowlist secret
    from app.config import get_settings
    get_settings.cache_clear()

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        with patch("app.routers.auth.oauth.google.authorize_redirect", new_callable=AsyncMock) as mock_redirect:
            from starlette.responses import RedirectResponse
            mock_redirect.return_value = RedirectResponse(url="https://accounts.google.com/o/oauth2/auth")
            resp = await client.get("/v1/auth/google/login", follow_redirects=False)
    assert resp.status_code in (302, 307, 200)
