"""Match repository — database queries only. Never commits."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Match, Resume


class MatchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_by_user(self, user_id: UUID) -> list[Match]:
        result = await self.db.execute(
            select(Match)
            .join(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Match.score.desc())
        )
        return list(result.scalars().all())
