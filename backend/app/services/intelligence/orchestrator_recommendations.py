"""Strategic Recommendation Engine — deterministic, explainable career recommendations.

Types: next_skill, next_project, certification, next_role, resume_improvement,
       portfolio, market_opportunity, salary_growth, specialization, career_risk
"""

from __future__ import annotations


def generate_recommendations(
    trajectory: dict,
    market: dict,
    roadmap_state,
    completed_nodes: list[str],
    deferred_nodes: list[str],
    user_skills: list[str],
) -> list[dict]:
    """Generate prioritized strategic recommendations from all intelligence signals."""
    recs: list[dict] = []
    user_set = set(s.lower() for s in user_skills)

    # 1. Next Best Skill — from market ROI
    for roi_skill in market.get("high_value_missing", [])[:2]:
        recs.append({
            "type": "next_skill",
            "title": f"Learn {roi_skill['skill'].title()}",
            "explanation": f"{roi_skill['skill'].title()} has {int(roi_skill['demand']*100)}% market demand and +{int(roi_skill['salary_premium']*100)}% salary premium.",
            "priority": "high" if roi_skill["roi_score"] >= 0.8 else "medium",
            "confidence": round(roi_skill["roi_score"], 2),
            "estimated_impact": "high",
            "related_domains": [roi_skill.get("skill", "")],
        })

    # 2. Adjacent Role Opportunity
    for adj in trajectory.get("adjacent_roles", [])[:1]:
        gap_count = len(adj["gap_skills"])
        recs.append({
            "type": "next_role",
            "title": f"You're {gap_count} skill{'s' if gap_count != 1 else ''} from {adj['role']}",
            "explanation": f"Currently {int(adj['readiness']*100)}% ready. Missing: {', '.join(adj['gap_skills'])}.",
            "priority": "high" if adj["readiness"] >= 0.6 else "medium",
            "confidence": round(adj["readiness"], 2),
            "estimated_impact": "high",
            "related_domains": adj["gap_skills"],
        })

    # 3. Specialization Reinforcement
    specs = trajectory.get("specializations", {})
    for domain, spec in specs.items():
        if spec.get("emerging") and spec["strength"] >= 0.4:
            recs.append({
                "type": "specialization",
                "title": f"Strengthen {domain.title()} specialization",
                "explanation": f"{domain.title()} is emerging ({int(spec['strength']*100)}% strength). Deepening it increases market value.",
                "priority": "medium",
                "confidence": round(spec["strength"], 2),
                "estimated_impact": "medium",
                "related_domains": spec.get("skills", [])[:3],
            })
            break  # Only one specialization rec

    # 4. Career Risk Warning — drift or weakening
    if trajectory.get("drift_detected"):
        recs.append({
            "type": "career_risk",
            "title": "Career trajectory shift detected",
            "explanation": trajectory.get("drift_details", "Your dominant path has changed."),
            "priority": "high",
            "confidence": 0.8,
            "estimated_impact": "high",
            "related_domains": [],
        })

    # Deferred pattern risk
    if len(deferred_nodes) >= 3:
        recs.append({
            "type": "career_risk",
            "title": "Multiple skills repeatedly deferred",
            "explanation": f"{len(deferred_nodes)} roadmap items deferred. Consider removing them or committing to a timeline.",
            "priority": "medium",
            "confidence": 0.7,
            "estimated_impact": "medium",
            "related_domains": deferred_nodes[:3],
        })

    # 5. Salary Growth Opportunity
    salary = market.get("salary_trajectory", {})
    if salary.get("growth_potential") == "high":
        recs.append({
            "type": "salary_growth",
            "title": "High salary growth potential detected",
            "explanation": f"Your skill velocity and market alignment suggest strong near-term earning growth.",
            "priority": "medium",
            "confidence": 0.7,
            "estimated_impact": "high",
            "related_domains": [],
        })

    # 6. Market Opportunity — rising demand skills user is close to
    for roi in market.get("roi_skills", [])[:5]:
        if roi["trend"] == "rising" and roi["roi_score"] >= 0.6 and roi["skill"] not in user_set:
            # Check if adjacent (user has related skills)
            recs.append({
                "type": "market_opportunity",
                "title": f"{roi['skill'].title()} demand is rising",
                "explanation": f"Market demand {int(roi['demand']*100)}%, trend rising, +{int(roi['salary_premium']*100)}% premium.",
                "priority": "medium",
                "confidence": round(roi["demand"], 2),
                "estimated_impact": "medium",
                "related_domains": [roi["skill"]],
            })
            break  # Only one market opportunity rec

    # Sort by priority then confidence
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recs.sort(key=lambda r: (priority_order.get(r["priority"], 1), -r["confidence"]))

    return recs[:8]
