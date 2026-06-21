import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.dependencies import get_current_user, get_resume_service, get_db
from app.models.user import User
from unittest.mock import AsyncMock, MagicMock

async def mock_get_current_user():
    return User(id="user-123", email="test@example.com")

async def mock_get_resume_service():
    mock_service = AsyncMock()
    mock_resume = AsyncMock()
    mock_resume.id = "resume-123"
    mock_resume.filename = "resume.pdf"
    mock_service.upload.return_value = mock_resume
    return mock_service

async def mock_get_db():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result
    yield mock_session

@pytest.mark.asyncio
async def test_rate_limit_on_resumes(client):
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[get_resume_service] = mock_get_resume_service
    app.dependency_overrides[get_db] = mock_get_db
    try:
        responses = []
        for _ in range(6):
            resp = await client.post(
                "/v1/resumes",
                files={"file": ("test.pdf", b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "application/pdf")}
            )
            responses.append(resp)
        # The 6th request should be rate limited
        assert responses[-1].status_code == 429
        assert "Rate limit exceeded" in responses[-1].text
    finally:
        app.dependency_overrides.clear()
