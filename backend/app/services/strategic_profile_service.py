"""Canonical StrategicProfile access — single source of truth for career state reads."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.strategic_profile import StrategicProfile


def _empty_profile_context() -> dict:
    return {
        "profile": None,
        "skills": [],
        "target_role": None,
        "specialization": None,
        "seniority": "mid",
        "growth_velocity": 0.0,
        "skill_confidences": {},
        "trajectory_state": {},
        "roadmap_progress": {},
        "opportunity_alignment": [],
        "market_alignment": 0.0,
        "preferred_domains": [],
        "has_profile": False,
    }


async def get_strategic_profile(db: AsyncSession, user_id: str) -> StrategicProfile | None:
    """Fetch the user's StrategicProfile, or None if not yet created."""
    result = await db.execute(
        select(StrategicProfile).where(StrategicProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_profile_context(db: AsyncSession, user_id: str) -> dict:
    """Return normalized profile fields for downstream intelligence routers."""
    profile = await get_strategic_profile(db, user_id)
    if not profile:
        return _empty_profile_context()

    trajectory = profile.trajectory_state or {}
    skills = profile.inferred_skills or []
    competitiveness = float(trajectory.get("competitiveness_score", 0) or 0)
    specialization = profile.active_specialization

    return {
        "profile": profile,
        "skills": skills,
        "target_role": profile.target_role,
        "specialization": specialization,
        "seniority": "senior" if competitiveness >= 0.7 else "mid",
        "growth_velocity": competitiveness,
        "skill_confidences": {s: 0.9 for s in skills},
        "trajectory_state": trajectory,
        "roadmap_progress": profile.roadmap_progress or {},
        "opportunity_alignment": profile.opportunity_alignment or [],
        "market_alignment": float(profile.market_alignment or 0.0),
        "preferred_domains": [specialization] if specialization else [],
        "has_profile": len(skills) > 0 or bool(profile.target_role),
    }


async def load_legacy_skill_context(db: AsyncSession, user_id: str) -> dict:
    """Legacy fallback when no StrategicProfile exists."""
    from app.services.intelligence import IntelligenceRepository
    from app.services.roadmap_intel import RoadmapRepository

    intel_repo = IntelligenceRepository(db)
    roadmap_repo = RoadmapRepository(db)
    skills_db = await intel_repo.get_user_skills(user_id)
    career_profile = await intel_repo.get_or_create_career_profile(user_id)
    roadmap = await roadmap_repo.get_active(user_id)

    skills = [s.normalized_skill for s in skills_db]
    return {
        "skills": skills,
        "skill_confidences": {s.normalized_skill: s.confidence_score for s in skills_db},
        "target_role": roadmap.target_role if roadmap else None,
        "specialization": (career_profile.preferred_domains or [None])[0],
        "seniority": career_profile.inferred_seniority or "mid",
        "growth_velocity": float(career_profile.growth_velocity or 0.0),
        "preferred_domains": career_profile.preferred_domains or [],
        "has_profile": bool(skills),
    }


async def load_intelligence_inputs(db: AsyncSession, user_id: str) -> dict:
    """Unified skill/signal loader — StrategicProfile first, legacy only when absent."""
    ctx = await get_profile_context(db, user_id)
    if ctx["has_profile"]:
        return {
            **ctx,
            "source": "strategic_profile",
        }
    legacy = await load_legacy_skill_context(db, user_id)
    return {
        "profile": None,
        "skills": legacy["skills"],
        "target_role": legacy["target_role"],
        "specialization": legacy["specialization"],
        "seniority": legacy["seniority"],
        "growth_velocity": legacy["growth_velocity"],
        "skill_confidences": legacy["skill_confidences"],
        "trajectory_state": {},
        "roadmap_progress": {},
        "opportunity_alignment": [],
        "market_alignment": 0.0,
        "preferred_domains": legacy["preferred_domains"],
        "has_profile": legacy["has_profile"],
        "source": "legacy",
    }


async def sync_legacy_intelligence_from_profile(
    db: AsyncSession, user_id: str, profile: StrategicProfile
) -> None:
    """Best-effort sync of legacy intelligence tables from canonical StrategicProfile."""
    from app.services.intelligence import IntelligenceRepository

    skills = profile.inferred_skills or []
    if not skills:
        return

    intel_repo = IntelligenceRepository(db)
    skills_payload = [
        {"skill": s, "confidence": 0.90, "proficiency": 0.85, "source": "strategic_profile_sync"}
        for s in skills
    ]
    await intel_repo.upsert_skills(user_id, skills_payload)

    career_profile = await intel_repo.get_or_create_career_profile(user_id)
    trajectory = profile.trajectory_state or {}
    career_profile.inferred_seniority = "senior" if trajectory.get("competitiveness_score", 0) >= 0.7 else "mid"
    career_profile.preferred_roles = [profile.target_role] if profile.target_role else []
    career_profile.preferred_domains = [profile.active_specialization] if profile.active_specialization else []
    career_profile.last_analysis_at = datetime.now(timezone.utc)
    career_profile.growth_velocity = float(trajectory.get("competitiveness_score", 0.80) or 0.80)
    await db.flush()


async def sync_legacy_roadmap_from_profile(
    db: AsyncSession,
    user_id: str,
    profile: StrategicProfile,
    *,
    milestones: list[dict] | None = None,
    focus_areas: list[str] | None = None,
    coverage: float | None = None,
    learning_velocity: float | None = None,
) -> None:
    """Sync legacy roadmap_states table from canonical StrategicProfile."""
    from app.services.roadmap_intel.roadmap_models import RoadmapState

    trajectory = profile.trajectory_state or {}
    target_role = profile.target_role or "Software Engineer"

    if milestones is None:
        existing = await db.execute(
            select(RoadmapState).where(RoadmapState.user_id == user_id)
        )
        row = existing.scalar_one_or_none()
        milestones = (row.roadmap_snapshot or {}).get("milestones", []) if row else []

    if focus_areas is None:
        focus_areas = []
    if coverage is None:
        coverage = 0.85
    if learning_velocity is None:
        learning_velocity = float(trajectory.get("competitiveness_score", 0.80) or 0.80)

    result = await db.execute(
        select(RoadmapState).where(RoadmapState.user_id == user_id)
    )
    legacy_roadmap = result.scalar_one_or_none()

    if not legacy_roadmap:
        legacy_roadmap = RoadmapState(
            user_id=user_id,
            target_role=target_role,
            roadmap_snapshot={"milestones": milestones},
            active_focus_areas=focus_areas,
            confidence_model={"coverage": coverage},
            learning_velocity=learning_velocity,
        )
        db.add(legacy_roadmap)
    else:
        legacy_roadmap.target_role = target_role
        legacy_roadmap.roadmap_snapshot = {"milestones": milestones}
        legacy_roadmap.active_focus_areas = focus_areas
        legacy_roadmap.confidence_model = {"coverage": coverage}
        legacy_roadmap.learning_velocity = learning_velocity
        legacy_roadmap.updated_at = datetime.now(timezone.utc)

    await db.flush()
