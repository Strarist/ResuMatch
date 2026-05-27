"""Match repository — database queries only. Never commits."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.opportunity import Match

from app.models.resume import Resume


class MatchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_user(self, user_id: UUID) -> list[Match]:
        result = await self.db.execute(
            select(Match)
            .join(Resume)
            .where(Resume.user_id == user_id)
            .options(selectinload(Match.resume), selectinload(Match.job))
            .order_by(Match.score.desc())
            .limit(50)
        )
        return list(result.scalars().all())
