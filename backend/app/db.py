"""Database engine and session lifecycle.

Pool sizing: Render free tier PostgreSQL allows max 5 connections.
pool_size=3 + max_overflow=2 = 5 max connections.

Session lifecycle:
- One session per request (injected via get_db dependency)
- Commit on success, rollback on exception, close always
- Repositories use flush() for generated IDs, never commit()
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_size=3,
    max_overflow=2,
    pool_pre_ping=True,
    pool_recycle=600,  # Recycle connections every 10 min (Render may close idle)
    echo=False,
)

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
