"""Intelligence repository — all DB operations for intelligence persistence."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intelligence.intelligence_models import (
    UserSkillProfile, UserCareerProfile, AnalysisMemoryEvent,
)


class IntelligenceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_skills(self, user_id: str, skills: list[dict]) -> None:
        """Batch upsert skill profiles."""
        if not skills:
            return
        now = datetime.now(timezone.utc)
        for skill_data in skills:
            result = await self.db.execute(
                select(UserSkillProfile).where(
                    UserSkillProfile.user_id == user_id,
                    UserSkillProfile.normalized_skill == skill_data["skill"],
                )
            )
            existing = result.scalar_one_or_none()
            if existing:
                existing.confidence_score = skill_data.get("confidence", 0.5)
                existing.proficiency_estimate = skill_data.get("proficiency", 0.5)
                existing.occurrence_count += 1
                existing.last_seen_at = now
            else:
                self.db.add(UserSkillProfile(
                    user_id=user_id,
                    normalized_skill=skill_data["skill"],
                    confidence_score=skill_data.get("confidence", 0.5),
                    proficiency_estimate=skill_data.get("proficiency", 0.5),
                    occurrence_count=1,
                    evidence_sources=[skill_data.get("source", "analysis")],
                    first_seen_at=now,
                    last_seen_at=now,
                ))
        await self.db.flush()

    async def get_user_skills(self, user_id: str) -> list[UserSkillProfile]:
        result = await self.db.execute(
            select(UserSkillProfile)
            .where(UserSkillProfile.user_id == user_id)
            .order_by(UserSkillProfile.confidence_score.desc())
        )
        return list(result.scalars().all())

    async def get_or_create_career_profile(self, user_id: str) -> UserCareerProfile:
        result = await self.db.execute(
            select(UserCareerProfile).where(UserCareerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            profile = UserCareerProfile(user_id=user_id)
            self.db.add(profile)
            await self.db.flush()
        return profile

    async def update_career_profile(self, profile: UserCareerProfile, **fields) -> None:
        for key, value in fields.items():
            setattr(profile, key, value)
        profile.updated_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def append_events(self, events: list[AnalysisMemoryEvent]) -> None:
        if not events:
            return
        self.db.add_all(events)
        await self.db.flush()

    async def get_timeline(self, user_id: str, limit: int = 50) -> list[AnalysisMemoryEvent]:
        result = await self.db.execute(
            select(AnalysisMemoryEvent)
            .where(AnalysisMemoryEvent.user_id == user_id)
            .order_by(AnalysisMemoryEvent.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
