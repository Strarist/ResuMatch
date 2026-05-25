"""Database engine and session lifecycle."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

# SQLite doesn't support pool_size/pool_pre_ping
_is_sqlite = settings.database_url.startswith("sqlite")

_engine_kwargs = {"echo": False}
if not _is_sqlite:
    _engine_kwargs.update(pool_size=3, max_overflow=2, pool_pre_ping=True, pool_recycle=600)

engine = create_async_engine(settings.database_url, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Request-scoped session with commit/rollback lifecycle."""
    session = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
