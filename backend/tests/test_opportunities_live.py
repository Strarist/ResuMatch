"""Live integration test for opportunities endpoints after fixing logger import.
Ensures endpoints return proper data without masking fallback.
"""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app as fastapi_app

@pytest.mark.asyncio
async def test_opportunities_endpoints_live(test_engine):
    # Generate unique email
    email = f"test-{uuid.uuid4()}@example.com"
    password = "StrongPass123!"
    # Register user (direct DB access not needed; use API)
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        # Register
        register_resp = await client.post("/v1/auth/register", json={"name": "Tester", "email": email, "password": password})
        assert register_resp.status_code == 200, f"Register failed: {register_resp.text}"
        # Login (optional, registration sets cookies)
        login_resp = await client.post("/v1/auth/login", json={"email": email, "password": password})
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        # Test matches endpoint
        matches_resp = await client.get("/v1/opportunities/matches")
        assert matches_resp.status_code == 200, f"Matches endpoint failed: {matches_resp.status_code} {matches_resp.text}"
        assert isinstance(matches_resp.json(), dict)
        assert "matches" in matches_resp.json()
        # Test gaps endpoint
        gaps_resp = await client.get("/v1/opportunities/gaps")
        assert gaps_resp.status_code == 200, f"Gaps endpoint failed: {gaps_resp.status_code} {gaps_resp.text}"
        assert isinstance(gaps_resp.json(), dict)
        assert "gaps" in gaps_resp.json()
        # Test radar endpoint
        radar_resp = await client.get("/v1/opportunities/radar")
        assert radar_resp.status_code == 200, f"Radar endpoint failed: {radar_resp.status_code} {radar_resp.text}"
        assert isinstance(radar_resp.json(), dict)
        radar_json = radar_resp.json()
    assert isinstance(radar_json, dict)
    # Verify expected radar keys are present
    for key in ["emerging_domains", "high_roi_skills", "salary_growth_paths", "underutilized_strengths", "momentum"]:
        assert key in radar_json
