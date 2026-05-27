"""Roadmap mutation engine — deterministic incremental adaptation of roadmaps.

Heuristics:
1. Completed nodes → removed from active milestones
2. Deferred nodes → priority decay (repeated deferral = lower priority)
3. Skill emergence → new gaps added as nodes
4. Specialization detection → 4+ related skills boost domain weighting
5. Near-readiness → adjacent missing skills get priority boost
"""

from app.services.roadmap_intel.career_gap_engine import compute_gaps
from app.services.roadmap_intel.goal_alignment_engine import compute_alignment
from app.services.intelligence.skill_normalizer import cluster_skills


def mutate_roadmap(
    current_snapshot: dict,
    user_skills: list[str],
    target_skills: list[str],
    completed_nodes: list[str],
    deferred_nodes: list[str],
    preferred_domains: list[str],
    growth_velocity: float,
) -> dict:
    """Incrementally mutate a roadmap. Returns snapshot, mutations, and new focus areas."""
    milestones = list(current_snapshot.get("milestones", []))
    mutations: list[dict] = []

    gaps = compute_gaps(user_skills, target_skills)
    alignment = compute_alignment(preferred_domains, completed_nodes, deferred_nodes, growth_velocity)

    # 1. Remove completed nodes
    completed_set = set(n.lower() for n in completed_nodes)
    active = [m for m in milestones if m.get("skill", "").lower() not in completed_set]
    removed = len(milestones) - len(active)
    if removed:
        mutations.append({"type": "nodes_completed", "count": removed})

    # 2. Deferred node priority decay
    deferred_set = set(n.lower() for n in deferred_nodes)
    for m in active:
        if m.get("skill", "").lower() in deferred_set:
            old_priority = m.get("priority", "medium")
            if old_priority == "high":
                m["priority"] = "medium"
                mutations.append({"type": "priority_decayed", "skill": m["skill"], "from": "high", "to": "medium"})
            elif old_priority == "medium":
                m["priority"] = "low"
                mutations.append({"type": "priority_decayed", "skill": m["skill"], "from": "medium", "to": "low"})

    # 3. Specialization detection — 4+ skills in a cluster boost that domain
    user_clusters = cluster_skills(user_skills)
    specialized_domains = [domain for domain, skills in user_clusters.items() if len(skills) >= 4]
    for m in active:
        skill_lower = m.get("skill", "").lower()
        for domain in specialized_domains:
            if domain.lower() in skill_lower or skill_lower in [s.lower() for s in user_clusters.get(domain, [])]:
                if m.get("priority") == "low":
                    m["priority"] = "medium"
                    mutations.append({"type": "specialization_boost", "skill": m["skill"], "domain": domain})
                    break

    # 4. Near-readiness boost — skills close to completion get priority
    for near in gaps.get("near_ready", []):
        for need_skill in near.get("need", []):
            for m in active:
                if m.get("skill", "").lower() == need_skill.lower() and m.get("priority") != "high":
                    m["priority"] = "high"
                    mutations.append({"type": "near_ready_boost", "skill": m["skill"], "domain": near["domain"]})

    # 5. Domain alignment — boost/reduce based on user trajectory
    for m in active:
        skill_lower = m.get("skill", "").lower()
        for domain in alignment["boost_domains"]:
            if domain.lower() in skill_lower:
                if m.get("priority") == "low":
                    m["priority"] = "medium"
                    mutations.append({"type": "domain_boost", "skill": m["skill"]})
                break
        for domain in alignment["reduce_domains"]:
            if domain.lower() in skill_lower:
                if m.get("priority") == "high":
                    m["priority"] = "medium"
                    mutations.append({"type": "domain_reduce", "skill": m["skill"]})
                break

    # 6. Add new gap nodes not already in roadmap
    existing_skills = set(m.get("skill", "").lower() for m in active)
    for gap in gaps["missing"][:5]:
        if gap["skill"].lower() not in existing_skills:
            active.append({
                "skill": gap["skill"],
                "priority": gap["priority"],
                "effort_weeks": 3,
                "impact_estimate": 8.0,
                "reason": "New gap detected",
                "prerequisites": gap["adjacent_to"][:2],
            })
            mutations.append({"type": "node_added", "skill": gap["skill"]})

    # 7. Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    active.sort(key=lambda m: priority_order.get(m.get("priority", "medium"), 1))

    # 8. Focus area recalculation
    focus = []
    if gaps["near_ready"]:
        focus.extend(g["domain"] for g in gaps["near_ready"][:2])
    focus.extend(specialized_domains[:2])
    focus.extend(alignment["boost_domains"][:2])
    focus = list(dict.fromkeys(focus))[:3]

    return {
        "snapshot": {"milestones": active[:15]},
        "mutations": mutations,
        "new_focus_areas": focus,
    }
