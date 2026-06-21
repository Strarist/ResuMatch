"""Database engine and session lifecycle."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.models.user import User
from app.models.opportunity import Job, Match
from app.models.strategic_profile import StrategicProfile
from app.models.strategic_memory import StrategicMemoryEvent, MemoryCluster, CausalEdge, PropagationEvent, LeverageDecision, RuntimeMutation, CopilotMessage
from app.models.agents import AgentRuntimeState, AgentDecision, AgentEvent, OrchestrationCycle, StrategicDirective
from app.models.orchestration import ReplayEvent, ReplayCheckpoint, ReplayValidation, ReplayDrift

from app.logger import logger

from app.config import get_settings
settings = get_settings()

db_url = settings.database_url
_is_sqlite = db_url.startswith("sqlite")

_engine_kwargs = {"echo": False}
if settings.env.value == "development" and settings.log_level.upper() == "DEBUG":
    _engine_kwargs["echo"] = True
if not _is_sqlite:
    _engine_kwargs.update(
        pool_size=20,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True
    )

engine = create_async_engine(db_url, **_engine_kwargs)
logger.info(f"Database engine initialized: {engine.url.get_backend_name()} with URL {db_url}")

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
