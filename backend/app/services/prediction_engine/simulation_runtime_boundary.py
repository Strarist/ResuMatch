from typing import Any, AsyncGenerator
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

class SimulationMutationBlockedError(Exception):
    """Exception raised when database write operations are attempted in a simulation sandbox."""
    pass

class SimulationRuntimeBoundary:
    """Enforces strict read-only execution state for simulation sandboxes."""

    @staticmethod
    @asynccontextmanager
    async def guard(db: AsyncSession) -> AsyncGenerator[None, None]:
        """Enforces a mutation block by temporarily overriding session commit and flush methods."""
        original_commit = db.commit
        original_flush = db.flush

        async def blocked_commit(*args: Any, **kwargs: Any) -> None:
            raise SimulationMutationBlockedError(
                "Database commit blocked: Mutations are strictly prohibited inside the simulation runtime boundary."
            )

        async def blocked_flush(*args: Any, **kwargs: Any) -> None:
            raise SimulationMutationBlockedError(
                "Database flush blocked: Mutations are strictly prohibited inside the simulation runtime boundary."
            )

        db.commit = blocked_commit
        db.flush = blocked_flush

        try:
            yield
        finally:
            db.commit = original_commit
            db.flush = original_flush
