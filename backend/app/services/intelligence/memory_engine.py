"""Memory engine — processes analysis results into persistent intelligence.

Pipeline (runs AFTER SSE streaming completes):
1. Extract skills from analysis result
2. Normalize skills
3. Load existing user skill profile
4. Compute deltas (new skills, strengthened skills)
5. Generate memory events
6. Persist updated profiles
7. Re-aggregate career profile
"""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.intelligence.intelligence_models import AnalysisMemoryEvent
from app.services.intelligence.intelligence_repository import IntelligenceRepository
from app.services.intelligence.profile_aggregator import aggregate_profile
from app.services.intelligence.skill_normalizer import normalize_skill_list

logger = logging.getLogger(__name__)


async def process_analysis_memory(
    db: AsyncSession,
    user_id: UUID,
    analysis_id: UUID,
    extracted_skills: list[str],
    analysis_source: str = "resume_analysis",
) -> None:
    """Process completed analysis into persistent intelligence. Non-blocking, idempotent."""
    repo = IntelligenceRepository(db)

    # 1. Normalize
    normalized = normalize_skill_list(extracted_skills)
    if not normalized:
        return

    # 2. Load existing skills
    existing = await repo.get_user_skills(user_id)
    existing_map = {s.normalized_skill: s for s in existing}

    # 3. Compute deltas and generate events
    events: list[AnalysisMemoryEvent] = []
    skill_updates: list[dict] = []

    for skill in normalized:
        prev = existing_map.get(skill)
        if prev is None:
            # New skill detected
            events.append(AnalysisMemoryEvent(
                user_id=user_id, analysis_id=analysis_id,
                event_type="skill_added",
                structured_payload={"skill": skill, "confidence": 0.5},
            ))
            skill_updates.append({"skill": skill, "confidence": 0.5, "proficiency": 0.5, "source": analysis_source})
        else:
            # Skill seen again — strengthen confidence
            new_confidence = min(prev.confidence_score + 0.15, 1.0)
            if new_confidence - prev.confidence_score >= 0.1:
                events.append(AnalysisMemoryEvent(
                    user_id=user_id, analysis_id=analysis_id,
                    event_type="skill_strengthened",
                    structured_payload={
                        "skill": skill,
                        "previous_confidence": round(prev.confidence_score, 3),
                        "new_confidence": round(new_confidence, 3),
                    },
                ))
            skill_updates.append({"skill": skill, "confidence": new_confidence, "proficiency": prev.proficiency_estimate, "source": analysis_source})

    # 4. Detect specializations from clusters
    from app.services.intelligence.skill_normalizer import cluster_skills
    clusters = cluster_skills(normalized)
    for domain, domain_skills in clusters.items():
        if len(domain_skills) >= 4:
            events.append(AnalysisMemoryEvent(
                user_id=user_id, analysis_id=analysis_id,
                event_type=f"{domain}_depth_detected",
                structured_payload={"domain": domain, "skills": domain_skills, "count": len(domain_skills)},
            ))

    # 5. Persist
    await repo.upsert_skills(user_id, skill_updates)
    await repo.append_events(events)

    # 6. Re-aggregate career profile
    all_skills = await repo.get_user_skills(user_id)
    profile = await repo.get_or_create_career_profile(user_id)
    updates = aggregate_profile(all_skills, profile)
    updates["last_analysis_at"] = datetime.now(timezone.utc)
    updates["resume_version_count"] = profile.resume_version_count + 1
    await repo.update_career_profile(profile, **updates)

    logger.info(f"Memory updated for user {user_id}: {len(skill_updates)} skills, {len(events)} events")
