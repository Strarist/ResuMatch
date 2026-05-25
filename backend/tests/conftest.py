"""Test fixtures for transactional isolation.

Each test runs inside a transaction that is rolled back after the test.
This means tests never persist data and can run in any order.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings, Settings
from app.db import get_db
from app.main import app
from app.models import Base


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

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
