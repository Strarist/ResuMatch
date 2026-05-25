"""Intelligence repository — all DB operations for intelligence persistence."""

from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.services.intelligence.intelligence_models import (
    UserSkillProfile, UserCareerProfile, AnalysisMemoryEvent,
)


class IntelligenceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # === Skill Profiles ===

    async def upsert_skills(self, user_id: UUID, skills: list[dict]) -> None:
        """Batch upsert skill profiles. Each dict: {skill, confidence, proficiency, source}."""
        if not skills:
            return
        now = datetime.now(timezone.utc)
        for skill_data in skills:
            stmt = pg_insert(UserSkillProfile).values(
                user_id=user_id,
                normalized_skill=skill_data["skill"],
                confidence_score=skill_data.get("confidence", 0.5),
                proficiency_estimate=skill_data.get("proficiency", 0.5),
                occurrence_count=1,
                evidence_sources=[skill_data.get("source", "analysis")],
                first_seen_at=now,
                last_seen_at=now,
            ).on_conflict_do_update(
                constraint="uq_user_skill",
                set_={
                    "confidence_score": skill_data.get("confidence", 0.5),
                    "proficiency_estimate": skill_data.get("proficiency", 0.5),
                    "occurrence_count": UserSkillProfile.occurrence_count + 1,
                    "last_seen_at": now,
                    "updated_at": now,
                },
            )
            await self.db.execute(stmt)
        await self.db.flush()

    async def get_user_skills(self, user_id: UUID) -> list[UserSkillProfile]:
        result = await self.db.execute(
            select(UserSkillProfile)
            .where(UserSkillProfile.user_id == user_id)
            .order_by(UserSkillProfile.confidence_score.desc())
        )
        return list(result.scalars().all())

    # === Career Profile ===

    async def get_or_create_career_profile(self, user_id: UUID) -> UserCareerProfile:
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

    # === Memory Events ===

    async def append_events(self, events: list[AnalysisMemoryEvent]) -> None:
        if not events:
            return
        self.db.add_all(events)
        await self.db.flush()

    async def get_timeline(self, user_id: UUID, limit: int = 50) -> list[AnalysisMemoryEvent]:
        result = await self.db.execute(
            select(AnalysisMemoryEvent)
            .where(AnalysisMemoryEvent.user_id == user_id)
            .order_by(AnalysisMemoryEvent.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
