"""Test fixtures for transactional isolation.

Each test runs inside a transaction that is rolled back after the test.
This means tests never persist data and can run in any order.
"""

import os
os.environ["ENV"] = "testing"
_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test.db"))
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_db_path}"
os.environ["JWT_SECRET"] = "test-secret-minimum-16-chars"
os.environ.setdefault("OPENROUTER_API_KEY", "sk-or-v1-test-integration-key-valid")

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings, Settings
from app.core.dependencies import get_db
from app.main import app as fastapi_app
from app.models.base import Base
import app.models.user
import app.models.strategic_profile
import app.models.user_progress


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Override settings for test environment."""
    import os
    os.environ.setdefault("ENV", "testing")
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./test.db")
    os.environ.setdefault("JWT_SECRET", "test-secret-minimum-16-chars")
    from app.config import get_settings as _get
    _get.cache_clear()
    return _get()


@pytest.fixture(scope="session")
async def test_engine(test_settings):
    """Create test database engine and tables."""
    engine = create_async_engine(test_settings.database_url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db_session(test_engine):
    """Per-test session with rollback isolation.

    Creates a transaction, yields the session, then rolls back.
    Tests see their own writes but nothing persists.
    """
    session_factory = async_sessionmaker(bind=test_engine, expire_on_commit=False)
    async with session_factory() as session:
        async with session.begin():
            yield session
            await session.rollback()


@pytest.fixture
async def client(db_session):
    """Test HTTP client with overridden DB dependency."""

    async def _override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()
