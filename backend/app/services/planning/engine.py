"""Strategic Execution Planner — generates short-term execution plans."""

from __future__ import annotations


def generate_execution_plan(
    focus_profile: dict,
    execution_profile: dict,
    roadmap_state,
    market: dict,
) -> dict:
    """Generate actionable execution plan based on strategic focus."""
    primary = focus_profile.get("primary_focus", "steady_progress")
    budget = focus_profile.get("attention_budget", {})
    maturity = focus_profile.get("specialization_maturity", {})
    momentum = execution_profile.get("momentum_score", 0)

    # Get roadmap milestones
    milestones = []
    if roadmap_state and roadmap_state.roadmap_snapshot:
        milestones = roadmap_state.roadmap_snapshot.get("milestones", [])

    # Immediate actions (today)
    immediate = _plan_immediate(primary, milestones, momentum)

    # Weekly targets
    weekly = _plan_weekly(primary, milestones, budget, maturity)

    # Strategic objective
    objective = _determine_objective(primary, focus_profile, maturity)

    # Blockers
    blockers = _identify_blockers(execution_profile, focus_profile)

    return {
        "immediate_actions": immediate,
        "weekly_targets": weekly,
        "strategic_objective": objective,
        "blocked_by": blockers,
        "estimated_completion_window": _estimate_window(primary, momentum),
        "plan_confidence": round(min(1.0, momentum * 0.5 + 0.3), 2),
    }


def _plan_immediate(primary: str, milestones: list, momentum: float) -> list[str]:
    actions = []
    if primary == "recovery":
        actions.append("Complete the easiest pending roadmap item")
        actions.append("Review and simplify your active goals")
    elif primary == "momentum_building":
        if milestones:
            easy = next((m for m in milestones if m.get("priority") == "low"), milestones[0] if milestones else None)
            if easy:
                actions.append(f"Start working on: {easy.get('skill', 'next milestone')}")
        actions.append("Spend 30 minutes on your primary focus area")
    elif primary == "acceleration":
        high = [m for m in milestones if m.get("priority") == "high"]
        if high:
            actions.append(f"Deep-dive into: {high[0].get('skill', 'top priority')}")
        actions.append("Consider a portfolio project to demonstrate mastery")
    else:
        if milestones:
            actions.append(f"Continue progress on: {milestones[0].get('skill', 'current focus')}")
    return actions[:3]


def _plan_weekly(primary: str, milestones: list, budget: dict, maturity: dict) -> list[str]:
    max_items = budget.get("max_active_items", 3)
    targets = []
    if primary == "recovery":
        targets.append("Complete 1 roadmap milestone")
        targets.append("Engage with workspace copilot for strategy review")
    elif primary == "specialization":
        targets.append("Focus exclusively on your dominant domain")
        targets.append("Defer all non-core skills")
    else:
        for m in milestones[:max_items]:
            targets.append(f"Progress on: {m.get('skill', 'milestone')}")

    if maturity.get("level") in ("advanced", "market_ready"):
        targets.append("Build or update portfolio evidence")

    return targets[:4]


def _determine_objective(primary: str, focus: dict, maturity: dict) -> str:
    if primary == "recovery":
        return "Rebuild execution momentum and consistency"
    if primary == "risk_mitigation":
        return "Address career risks before advancing"
    if primary == "specialization":
        return f"Deepen {maturity.get('domain', 'primary')} specialization"
    if primary == "acceleration":
        return f"Advance toward {focus.get('secondary_focus', 'next milestone')}"
    return "Maintain steady progress toward career goals"


def _identify_blockers(execution: dict, focus: dict) -> list[str]:
    blockers = []
    if execution.get("stagnation_risk") == "high":
        blockers.append("Stagnation pattern — needs momentum reset")
    if focus.get("roadmap_load", {}).get("overloaded"):
        blockers.append("Roadmap overloaded — simplification needed")
    if execution.get("execution_style") == "inconsistent":
        blockers.append("Inconsistent engagement — needs habit formation")
    return blockers


def _estimate_window(primary: str, momentum: float) -> str:
    if primary == "recovery":
        return "1-2 weeks to rebuild momentum"
    if momentum >= 0.7:
        return "On track — next milestone in days"
    if momentum >= 0.4:
        return "1-2 weeks to next milestone"
    return "2-4 weeks with consistent effort"
