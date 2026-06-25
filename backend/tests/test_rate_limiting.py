import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.core.dependencies import get_current_user, get_resume_service, get_db
from app.models.user import User
from app.config import Environment
from app.security import RateGovernor
from unittest.mock import AsyncMock, MagicMock, patch


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
async def test_rate_governor_blocks_after_upload_limit():
    """Unit test for sliding-window governor (middleware skips limits when ENV=testing)."""
    governor = RateGovernor()
    key = "127.0.0.1:upload"
    with patch("app.infrastructure.redis.get_redis", new_callable=AsyncMock, return_value=None):
        for _ in range(5):
            assert await governor.check(key, 5, 60) is True
        assert await governor.check(key, 5, 60) is False


@pytest.mark.asyncio
async def test_rate_limit_on_resumes(client):
    app.dependency_overrides[get_current_user] = mock_get_current_user
    app.dependency_overrides[get_resume_service] = mock_get_resume_service
    app.dependency_overrides[get_db] = mock_get_db
    try:
        from app.config import get_settings
        get_settings.cache_clear()
        mock_settings = MagicMock()
        mock_settings.env = Environment.development
        with patch("app.config.get_settings", return_value=mock_settings), patch(
            "app.infrastructure.redis.get_redis", new_callable=AsyncMock, return_value=None
        ):
            responses = []
            for _ in range(6):
                resp = await client.post(
                    "/v1/resumes",
                    files={"file": ("test.pdf", b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "application/pdf")},
                )
                responses.append(resp)
        assert responses[-1].status_code == 429
        assert "Rate limit exceeded" in responses[-1].text
    finally:
        app.dependency_overrides.clear()
