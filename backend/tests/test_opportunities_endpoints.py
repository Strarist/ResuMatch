"""Integration tests for Opportunities endpoints to verify proper error handling after fixing logger import and fallback removal."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app

@pytest.mark.asyncio
async def test_opportunities_endpoints_flow(test_engine):
    # Use direct AsyncClient with ASGI transport to avoid transaction context manager issues
    # when endpoints call db.commit()
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        from app.config import get_settings
        from app.db import engine
        print("DEBUG test_settings DATABASE_URL:", get_settings().database_url)
        print("DEBUG engine URL:", engine.url)
        # Register a new user
        register_payload = {
            "name": "Test User",
            "email": "test-endpoints@example.com",
            "password": "StrongPass123!",
        }
        register_resp = await client.post("/v1/auth/register", json=register_payload)
        assert register_resp.status_code == 200

        # Login
        login_payload = {"email": "test-endpoints@example.com", "password": "StrongPass123!"}
        login_resp = await client.post("/v1/auth/login", json=login_payload)
        assert login_resp.status_code == 200

        # Access Opportunities endpoints
        for path in ["/v1/opportunities/matches", "/v1/opportunities/gaps", "/v1/opportunities/radar"]:
            resp = await client.get(path)
            # Should succeed without internal server error
            assert resp.status_code == 200, f"{path} returned {resp.status_code} with detail {resp.text}"
            # Basic structure checks
            json_data = resp.json()
            assert isinstance(json_data, dict)
            # Ensure non-empty keys based on endpoint
            if "matches" in json_data:
                assert isinstance(json_data["matches"], list)
            if "gaps" in json_data:
                assert isinstance(json_data["gaps"], list)
            if "radar" in json_data:
                assert isinstance(json_data["radar"], dict)
