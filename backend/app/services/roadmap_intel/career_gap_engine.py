"""Career gap engine — computes intelligent skill gaps against target roles."""

from app.services.intelligence.skill_normalizer import cluster_skills, normalize_skill_list


def compute_gaps(user_skills: list[str], target_skills: list[str]) -> dict:
    """Compute skill gaps with adjacency and readiness scoring.

    Returns:
        {
            "missing": [{"skill": str, "priority": str, "adjacent_to": list}],
            "near_ready": [{"domain": str, "have": list, "need": list}],
            "coverage": float (0-1)
        }
    """
    user_set = set(s.lower() for s in user_skills)
    target_normalized = normalize_skill_list(target_skills)

    missing = []
    matched = 0
    for skill in target_normalized:
        if skill.lower() in user_set:
            matched += 1
        else:
            # Find adjacent skills the user already has
            adjacent = _find_adjacent(skill, user_skills)
            priority = "high" if not adjacent else "medium"
            missing.append({"skill": skill, "priority": priority, "adjacent_to": adjacent})

    # Detect near-readiness by cluster
    user_clusters = cluster_skills(user_skills)
    target_clusters = cluster_skills(target_skills)
    near_ready = []
    for domain, needed in target_clusters.items():
        have = user_clusters.get(domain, [])
        need = [s for s in needed if s.lower() not in user_set]
        if have and need and len(have) >= len(need):
            near_ready.append({"domain": domain, "have": have, "need": need})

    coverage = matched / max(len(target_normalized), 1)
    return {"missing": missing, "near_ready": near_ready, "coverage": round(coverage, 3)}


_ADJACENCY: dict[str, list[str]] = {
    "kubernetes": ["docker", "linux", "aws", "gcp"],
    "terraform": ["aws", "docker", "ci/cd"],
    "react": ["javascript", "typescript", "html", "css"],
    "next.js": ["react", "node.js", "typescript"],
    "fastapi": ["python", "rest api"],
    "django": ["python", "sql"],
    "system design": ["microservices", "docker", "postgresql"],
    "machine learning": ["python", "numpy", "statistics"],
}


def _find_adjacent(skill: str, user_skills: list[str]) -> list[str]:
    """Find user skills that are adjacent to the target skill."""
    key = skill.lower()
    related = _ADJACENCY.get(key, [])
    user_lower = set(s.lower() for s in user_skills)
    return [r for r in related if r in user_lower]
