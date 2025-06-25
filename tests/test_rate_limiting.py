import pytest
from httpx import AsyncClient
from backend.app.main import app

@pytest.mark.asyncio
async def test_rate_limit_on_resumes():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        responses = []
        for _ in range(6):
            resp = await ac.post("/v1/resumes", files={"file": ("test.pdf", b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "application/pdf")})
            responses.append(resp)
        # The 6th request should be rate limited
        assert responses[-1].status_code == 429
        assert "Too many requests" in responses[-1].text 