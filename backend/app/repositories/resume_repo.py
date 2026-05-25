"""Resume repository — database queries only. Never commits."""

from sqlalchemy import select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Resume


class ResumeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, *, id: str, filename: str, user_id: int) -> Resume:
        resume = Resume(id=id, filename=filename, user_id=user_id, skills=[])
        self.db.add(resume)
        await self.db.flush()
        return resume

    async def get_by_id(self, resume_id: str, user_id: int) -> Resume | None:
        result = await self.db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int) -> list[Resume]:
        result = await self.db.execute(
            select(Resume).where(Resume.user_id == user_id).order_by(Resume.uploaded_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, resume_id: str) -> None:
        await self.db.execute(sa_delete(Resume).where(Resume.id == resume_id))

    async def update_skills(self, resume: Resume, skills: list[str]) -> None:
        resume.skills = skills
        await self.db.flush()
