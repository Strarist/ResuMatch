"""Roadmap mutation engine — incremental adaptation of existing roadmaps."""

from app.services.roadmap_intel.career_gap_engine import compute_gaps
from app.services.roadmap_intel.goal_alignment_engine import compute_alignment


def mutate_roadmap(
    current_snapshot: dict,
    user_skills: list[str],
    target_skills: list[str],
    completed_nodes: list[str],
    deferred_nodes: list[str],
    preferred_domains: list[str],
    growth_velocity: float,
) -> dict:
    """Incrementally mutate a roadmap based on intelligence signals.

    Returns:
        {
            "snapshot": dict (updated roadmap),
            "mutations": list[dict] (changes made),
            "new_focus_areas": list[str],
        }
    """
    milestones = current_snapshot.get("milestones", [])
    mutations: list[dict] = []

    # 1. Compute current gaps
    gaps = compute_gaps(user_skills, target_skills)

    # 2. Compute alignment
    alignment = compute_alignment(preferred_domains, completed_nodes, deferred_nodes, growth_velocity)

    # 3. Remove completed nodes from active milestones
    completed_set = set(n.lower() for n in completed_nodes)
    active_milestones = [m for m in milestones if m.get("skill", "").lower() not in completed_set]
    removed = len(milestones) - len(active_milestones)
    if removed:
        mutations.append({"type": "nodes_completed", "count": removed})

    # 4. Reprioritize based on alignment
    for m in active_milestones:
        skill_lower = m.get("skill", "").lower()
        # Boost priority for preferred domains
        for domain in alignment["boost_domains"]:
            if domain.lower() in skill_lower or any(domain.lower() in str(m.get("reason", "")).lower() for _ in [1]):
                if m.get("priority") == "low":
                    m["priority"] = "medium"
                    mutations.append({"type": "priority_boosted", "skill": m["skill"]})
        # Reduce priority for deferred domains
        for domain in alignment["reduce_domains"]:
            if domain.lower() in skill_lower:
                if m.get("priority") == "high":
                    m["priority"] = "medium"
                    mutations.append({"type": "priority_reduced", "skill": m["skill"]})

    # 5. Add new gaps not already in roadmap
    existing_skills = set(m.get("skill", "").lower() for m in active_milestones)
    for gap in gaps["missing"][:5]:
        if gap["skill"].lower() not in existing_skills:
            active_milestones.append({
                "skill": gap["skill"],
                "priority": gap["priority"],
                "effort_weeks": 3,
                "impact_estimate": 8.0,
                "reason": "New gap detected",
                "prerequisites": gap["adjacent_to"][:2],
            })
            mutations.append({"type": "node_added", "skill": gap["skill"]})

    # 6. Sort: high > medium > low
    priority_order = {"high": 0, "medium": 1, "low": 2}
    active_milestones.sort(key=lambda m: priority_order.get(m.get("priority", "medium"), 1))

    # 7. Determine focus areas
    new_focus = alignment["boost_domains"][:3]
    if gaps["near_ready"]:
        new_focus = [g["domain"] for g in gaps["near_ready"][:2]] + new_focus
    new_focus = list(dict.fromkeys(new_focus))[:3]

    return {
        "snapshot": {"milestones": active_milestones[:15]},
        "mutations": mutations,
        "new_focus_areas": new_focus,
    }
