"""Database engine and session lifecycle.

Session lifecycle contract:
- One session per request (injected via get_db dependency)
- Commit happens once at the end of a successful request
- Rollback happens automatically on any unhandled exception
- Session is always closed in finally block

Repositories MUST NOT call commit(). They call flush() if they need
generated IDs. The session dependency owns the transaction boundary.
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
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,
    echo=False,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Request-scoped session with commit/rollback lifecycle.

    On success: commits the transaction.
    On exception: rolls back, then re-raises.
    Always: closes the session.
    """
    session = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
