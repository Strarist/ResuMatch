"""Trajectory repository — persistence operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.trajectory.models import CareerTrajectorySnapshot, TrajectoryEvent


class TrajectoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_latest(self, user_id: str) -> CareerTrajectorySnapshot | None:
        result = await self.db.execute(
            select(CareerTrajectorySnapshot)
            .where(CareerTrajectorySnapshot.user_id == user_id)
            .order_by(CareerTrajectorySnapshot.updated_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def upsert(self, user_id: str, data: dict) -> CareerTrajectorySnapshot:
        existing = await self.get_latest(user_id)
        if existing:
            for k, v in data.items():
                setattr(existing, k, v)
            await self.db.flush()
            return existing
        snapshot = CareerTrajectorySnapshot(user_id=user_id, **data)
        self.db.add(snapshot)
        await self.db.flush()
        return snapshot

    async def append_event(self, event: TrajectoryEvent) -> None:
        self.db.add(event)
        await self.db.flush()

    async def get_timeline(self, user_id: str, limit: int = 20) -> list[TrajectoryEvent]:
        result = await self.db.execute(
            select(TrajectoryEvent)
            .where(TrajectoryEvent.user_id == user_id)
            .order_by(TrajectoryEvent.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
