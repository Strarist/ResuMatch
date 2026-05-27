"""Career Risk Engine + Intervention Engine — deterministic risk detection and strategic interventions."""

from __future__ import annotations


def compute_career_risks(
    execution_profile: dict,
    trajectory: dict,
    market: dict,
    user_skills: list[str],
) -> dict:
    """Detect career risks and generate mitigation actions."""
    risks: list[dict] = []
    user_set = set(s.lower() for s in user_skills)
    specs = trajectory.get("specializations", {})
    readiness = trajectory.get("readiness_scores", {})
    attractiveness = market.get("recruiter_attractiveness", {})

    # 1. Oversaturated specialization
    for domain, data in specs.items():
        if data.get("dominant") and domain in ("frontend", "backend"):
            skill_demand = market.get("skill_demand", [])
            saturated = [s for s in skill_demand if s.get("saturation") == "high" and s["skill"] in [sk.lower() for sk in data.get("skills", [])]]
            if len(saturated) >= 3:
                risks.append({"type": "oversaturated_specialization", "severity": "medium", "detail": f"{domain.title()} skills are highly saturated in market", "mitigation": "Diversify into adjacent low-saturation domains"})

    # 2. Weak portfolio proof
    if execution_profile.get("completed_count", 0) < 3 and execution_profile.get("days_since_activity", 0) > 7:
        risks.append({"type": "weak_portfolio", "severity": "medium", "detail": "Few completed milestones to demonstrate capability", "mitigation": "Complete 2-3 roadmap items to build proof"})

    # 3. Fragmented stack
    if len(specs) >= 4 and all(s.get("strength", 0) < 0.4 for s in specs.values()):
        risks.append({"type": "fragmented_stack", "severity": "high", "detail": "Skills spread across too many domains without depth", "mitigation": "Focus on 1-2 domains to build specialization"})

    # 4. Poor market alignment
    if attractiveness.get("overall_score", 0) < 0.4:
        risks.append({"type": "poor_market_alignment", "severity": "medium", "detail": "Profile doesn't align well with market demand", "mitigation": "Prioritize high-demand skills in your roadmap"})

    # 5. Inconsistent execution
    if execution_profile.get("execution_style") == "inconsistent":
        risks.append({"type": "inconsistent_execution", "severity": "medium", "detail": "Engagement pattern is irregular", "mitigation": "Set smaller, achievable weekly goals"})

    # 6. Stagnation
    if execution_profile.get("stagnation_risk") == "high":
        risks.append({"type": "stagnation", "severity": "high", "detail": "Multiple stagnation signals detected", "mitigation": "Simplify roadmap and focus on one achievable milestone"})

    risk_score = min(1.0, len(risks) * 0.2 + (0.3 if any(r["severity"] == "high" for r in risks) else 0))

    return {
        "risk_score": round(risk_score, 3),
        "primary_risks": risks[:5],
        "risk_count": len(risks),
    }


def generate_interventions(
    execution_profile: dict,
    career_risks: dict,
    trajectory: dict,
    market: dict,
) -> list[dict]:
    """Generate strategic interventions based on execution state and risks."""
    interventions: list[dict] = []
    style = execution_profile.get("execution_style", "inconsistent")
    stagnation = execution_profile.get("stagnation_risk", "none")
    momentum = execution_profile.get("momentum_score", 0)

    # Stagnation interventions
    if stagnation == "high":
        interventions.append({
            "type": "simplify_roadmap",
            "title": "Simplify your roadmap",
            "explanation": "You have multiple stagnation signals. Focus on completing just one skill this week.",
            "priority": "high",
            "estimated_impact": "high",
        })

    # Low momentum
    if momentum < 0.3:
        interventions.append({
            "type": "recover_consistency",
            "title": "Rebuild momentum with small wins",
            "explanation": "Start with the easiest roadmap item to rebuild your execution streak.",
            "priority": "high",
            "estimated_impact": "medium",
        })

    # Explorer style — too much context switching
    if style == "explorer":
        interventions.append({
            "type": "narrow_specialization",
            "title": "Pick one domain and go deep",
            "explanation": "You're exploring broadly. Narrowing focus will accelerate market value faster.",
            "priority": "medium",
            "estimated_impact": "high",
        })

    # High velocity — unlock advanced
    if style in ("sprinter", "highly_disciplined") and momentum >= 0.7:
        interventions.append({
            "type": "accelerate_advanced",
            "title": "You're ready for advanced challenges",
            "explanation": "Your execution is strong. Consider system design, architecture, or leadership skills.",
            "priority": "medium",
            "estimated_impact": "high",
        })

    # Market-driven intervention
    high_roi = market.get("high_value_missing", [])
    if high_roi and momentum >= 0.4:
        top = high_roi[0]
        interventions.append({
            "type": "prioritize_salary_growth",
            "title": f"Learn {top['skill'].title()} for salary growth",
            "explanation": f"{top['skill'].title()} has +{int(top['salary_premium']*100)}% salary premium and rising demand.",
            "priority": "medium",
            "estimated_impact": "high",
        })

    # Portfolio proof
    if execution_profile.get("completed_count", 0) >= 3 and career_risks.get("risk_score", 0) < 0.4:
        interventions.append({
            "type": "build_portfolio_proof",
            "title": "Build a showcase project",
            "explanation": "You have the skills. Now demonstrate them with a portfolio project.",
            "priority": "medium",
            "estimated_impact": "medium",
        })

    return interventions[:5]
