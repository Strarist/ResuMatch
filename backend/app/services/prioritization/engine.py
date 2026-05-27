"""Strategic Prioritization Engine — determines what matters most right now.

Coordinates all intelligence layers into a single strategic focus profile.
Implements attention budgeting to prevent cognitive overload.
"""

from __future__ import annotations

# === Specialization Maturity Levels ===
MATURITY_LEVELS = ["exploratory", "developing", "focused", "advanced", "market_ready", "highly_differentiated"]


def compute_strategic_focus(
    execution_profile: dict,
    trajectory: dict,
    market: dict,
    risks: dict,
    roadmap_state,
    recommendations: list[dict],
) -> dict:
    """Compute unified strategic focus profile."""
    momentum = execution_profile.get("momentum_score", 0)
    stagnation = execution_profile.get("stagnation_risk", "none")
    style = execution_profile.get("execution_style", "inconsistent")
    dominant = trajectory.get("dominant_path", "Unknown")
    specs = trajectory.get("specializations", {})
    risk_score = risks.get("risk_score", 0)

    # 1. Determine primary focus
    primary_focus, reasoning = _determine_primary_focus(momentum, stagnation, style, risk_score, dominant)

    # 2. Secondary focus
    secondary_focus = _determine_secondary_focus(trajectory, market, primary_focus)

    # 3. Suppressed focuses (things to hide/delay)
    suppressed = _determine_suppressed(stagnation, style, momentum)

    # 4. Attention budget
    attention_budget = _compute_attention_budget(momentum, stagnation, style)

    # 5. Execution priority order
    priority_order = _compute_priority_order(recommendations, attention_budget, primary_focus)

    # 6. Specialization maturity
    maturity = _compute_specialization_maturity(specs, execution_profile, trajectory)

    # 7. Roadmap capacity
    roadmap_load = _compute_roadmap_load(roadmap_state)

    return {
        "primary_focus": primary_focus,
        "secondary_focus": secondary_focus,
        "suppressed_focuses": suppressed,
        "execution_priority_order": priority_order,
        "strategic_reasoning": reasoning,
        "attention_budget": attention_budget,
        "specialization_maturity": maturity,
        "roadmap_load": roadmap_load,
        "weekly_focus_limit": attention_budget["max_active_items"],
    }


def _determine_primary_focus(momentum: float, stagnation: str, style: str, risk_score: float, dominant: str) -> tuple[str, str]:
    if stagnation == "high":
        return "recovery", "High stagnation detected. Focus on rebuilding momentum with small wins."
    if risk_score >= 0.6:
        return "risk_mitigation", "Career risks are elevated. Address primary risks before advancing."
    if momentum < 0.3:
        return "momentum_building", "Low momentum. Prioritize completing one achievable milestone."
    if style == "explorer":
        return "specialization", "Broad exploration detected. Narrowing focus will accelerate growth."
    if momentum >= 0.7:
        return "acceleration", f"Strong momentum. Push toward advanced {dominant} milestones."
    return "steady_progress", f"Continue building toward {dominant} with consistent execution."


def _determine_secondary_focus(trajectory: dict, market: dict, primary: str) -> str:
    if primary in ("recovery", "momentum_building"):
        return "consistency"
    adj = trajectory.get("adjacent_roles", [])
    if adj and adj[0].get("readiness", 0) >= 0.6:
        return f"adjacent_role:{adj[0]['role']}"
    high_roi = market.get("high_value_missing", [])
    if high_roi:
        return f"skill_acquisition:{high_roi[0]['skill']}"
    return "portfolio_building"


def _determine_suppressed(stagnation: str, style: str, momentum: float) -> list[str]:
    suppressed = []
    if stagnation == "high":
        suppressed.extend(["advanced_recommendations", "new_role_suggestions", "certification_suggestions"])
    if momentum < 0.3:
        suppressed.append("complex_project_suggestions")
    if style == "inconsistent":
        suppressed.append("multi_domain_recommendations")
    return suppressed


def _compute_attention_budget(momentum: float, stagnation: str, style: str) -> dict:
    if stagnation == "high":
        return {"max_active_items": 2, "max_recommendations": 2, "max_roadmap_visible": 3, "level": "minimal"}
    if momentum < 0.3:
        return {"max_active_items": 3, "max_recommendations": 3, "max_roadmap_visible": 5, "level": "focused"}
    if style in ("sprinter", "highly_disciplined"):
        return {"max_active_items": 7, "max_recommendations": 6, "max_roadmap_visible": 10, "level": "expanded"}
    return {"max_active_items": 5, "max_recommendations": 4, "max_roadmap_visible": 7, "level": "standard"}


def _compute_priority_order(recommendations: list[dict], budget: dict, primary_focus: str) -> list[str]:
    """Return ordered list of recommendation titles, capped by attention budget."""
    max_recs = budget["max_recommendations"]
    # Filter by alignment with primary focus
    aligned = []
    other = []
    for r in recommendations:
        if primary_focus == "recovery" and r.get("type") in ("next_skill", "market_opportunity"):
            other.append(r["title"])
        else:
            aligned.append(r["title"])
    return (aligned + other)[:max_recs]


def _compute_specialization_maturity(specs: dict, execution: dict, trajectory: dict) -> dict:
    """Compute maturity level for dominant specialization."""
    dominant_specs = [(d, s) for d, s in specs.items() if s.get("dominant") or s.get("strength", 0) >= 0.5]
    if not dominant_specs:
        return {"level": "exploratory", "score": 0.0, "domain": None}

    domain, data = max(dominant_specs, key=lambda x: x[1]["strength"])
    strength = data["strength"]
    momentum_score = execution.get("momentum_score", 0)
    completion = execution.get("completion_velocity", 0)
    competitiveness = trajectory.get("competitiveness_score", 0)

    # Composite maturity score
    score = strength * 0.4 + completion * 0.2 + momentum_score * 0.2 + competitiveness * 0.2
    score = min(1.0, score)

    if score >= 0.85:
        level = "highly_differentiated"
    elif score >= 0.7:
        level = "market_ready"
    elif score >= 0.55:
        level = "advanced"
    elif score >= 0.4:
        level = "focused"
    elif score >= 0.25:
        level = "developing"
    else:
        level = "exploratory"

    return {"level": level, "score": round(score, 3), "domain": domain}


def _compute_roadmap_load(roadmap_state) -> dict:
    if not roadmap_state or not roadmap_state.roadmap_snapshot:
        return {"active_nodes": 0, "capacity": "empty", "overloaded": False}
    milestones = roadmap_state.roadmap_snapshot.get("milestones", [])
    high = sum(1 for m in milestones if m.get("priority") == "high")
    total = len(milestones)
    overloaded = high > 5 or total > 12
    capacity = "overloaded" if overloaded else "heavy" if total > 8 else "balanced" if total > 4 else "light"
    return {"active_nodes": total, "high_priority": high, "capacity": capacity, "overloaded": overloaded}
