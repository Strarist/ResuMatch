"""Roadmap repository — persistence operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.roadmap_intel.roadmap_models import RoadmapState, RoadmapEvent


class RoadmapRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active(self, user_id: str, target_role: str | None = None) -> RoadmapState | None:
        q = select(RoadmapState).where(
            RoadmapState.user_id == user_id, RoadmapState.current_stage == "active"
        )
        if target_role:
            q = q.where(RoadmapState.target_role == target_role)
        q = q.order_by(RoadmapState.updated_at.desc()).limit(1)
        result = await self.db.execute(q)
        return result.scalar_one_or_none()

    async def create(self, **fields) -> RoadmapState:
        state = RoadmapState(**fields)
        self.db.add(state)
        await self.db.flush()
        return state

    async def update(self, state: RoadmapState, **fields) -> None:
        for k, v in fields.items():
            setattr(state, k, v)
        await self.db.flush()

    async def append_event(self, event: RoadmapEvent) -> None:
        self.db.add(event)
        await self.db.flush()

    async def get_timeline(self, user_id: str, limit: int = 30) -> list[RoadmapEvent]:
        result = await self.db.execute(
            select(RoadmapEvent)
            .where(RoadmapEvent.user_id == user_id)
            .order_by(RoadmapEvent.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
