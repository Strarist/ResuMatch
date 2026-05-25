"""Profile aggregator — computes career intelligence from skill data."""

from app.services.intelligence.intelligence_models import UserSkillProfile, UserCareerProfile
from app.services.intelligence.skill_normalizer import cluster_skills


def aggregate_profile(skills: list[UserSkillProfile], profile: UserCareerProfile) -> dict:
    """Compute aggregated career intelligence from skill profiles.

    Returns fields to update on UserCareerProfile.
    """
    if not skills:
        return {}

    skill_names = [s.normalized_skill for s in skills]
    clusters = cluster_skills(skill_names)

    # Strongest clusters (sorted by skill count)
    strongest = sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True)
    strongest_clusters = [{"domain": k, "skills": v, "count": len(v)} for k, v in strongest[:5]]

    # Infer seniority from skill breadth + confidence
    avg_confidence = sum(s.confidence_score for s in skills) / len(skills)
    skill_count = len(skills)
    if skill_count >= 20 and avg_confidence >= 0.7:
        seniority = "senior"
    elif skill_count >= 12 and avg_confidence >= 0.5:
        seniority = "mid"
    else:
        seniority = "junior"

    # Preferred domains (top clusters)
    preferred_domains = [c["domain"] for c in strongest_clusters[:3]]

    # Growth velocity: ratio of recently-updated skills to total
    recent_skills = sum(1 for s in skills if s.occurrence_count > 1)
    growth_velocity = recent_skills / max(len(skills), 1)

    # Confidence snapshot
    confidence_snapshot = {
        "avg_confidence": round(avg_confidence, 3),
        "total_skills": skill_count,
        "high_confidence_count": sum(1 for s in skills if s.confidence_score >= 0.7),
    }

    return {
        "inferred_seniority": seniority,
        "strongest_skill_clusters": strongest_clusters,
        "preferred_domains": preferred_domains,
        "growth_velocity": round(growth_velocity, 3),
        "confidence_snapshot": confidence_snapshot,
    }
