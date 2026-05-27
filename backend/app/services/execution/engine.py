"""Execution Tracking Engine — behavioral momentum, velocity, streaks, stagnation detection.

Deterministic. No LLM. Uses roadmap state, recommendation actions, and operational events.
"""

from __future__ import annotations
from datetime import datetime, timezone, timedelta


def compute_execution_profile(
    completed_nodes: list[str],
    deferred_nodes: list[str],
    recommendation_actions: list[dict],
    operational_events: list[dict],
    roadmap_version: int,
    growth_velocity: float,
    last_upload_at: str | None,
    last_activity_at: str | None,
) -> dict:
    """Compute full execution profile from behavioral signals."""
    now = datetime.now(timezone.utc)

    # 1. Completion velocity
    total_nodes = len(completed_nodes) + len(deferred_nodes)
    completion_rate = len(completed_nodes) / max(total_nodes, 1)

    # 2. Recommendation engagement
    accepted = sum(1 for a in recommendation_actions if a.get("action") == "accept")
    deferred_recs = sum(1 for a in recommendation_actions if a.get("action") == "defer")
    dismissed = sum(1 for a in recommendation_actions if a.get("action") == "dismiss")
    total_actions = len(recommendation_actions)
    acceptance_rate = accepted / max(total_actions, 1)

    # 3. Activity recency
    days_since_activity = _days_since(last_activity_at, now)
    days_since_upload = _days_since(last_upload_at, now)

    # 4. Momentum score (0-1)
    momentum = (
        completion_rate * 0.3 +
        acceptance_rate * 0.2 +
        growth_velocity * 0.2 +
        _recency_score(days_since_activity) * 0.2 +
        min(roadmap_version / 5, 1.0) * 0.1
    )
    momentum = round(min(1.0, momentum), 3)

    # 5. Stagnation detection
    stagnation = _detect_stagnation(
        days_since_activity, days_since_upload, len(deferred_nodes),
        completion_rate, total_actions, growth_velocity
    )

    # 6. Execution style
    style = _classify_execution_style(
        completion_rate, acceptance_rate, days_since_activity,
        growth_velocity, len(deferred_nodes), roadmap_version
    )

    # 7. Streaks (simplified — based on roadmap version as proxy for consistent engagement)
    consistency_score = min(1.0, roadmap_version * 0.15 + completion_rate * 0.5)

    return {
        "momentum_score": momentum,
        "execution_consistency": round(consistency_score, 3),
        "completion_velocity": round(completion_rate, 3),
        "acceptance_rate": round(acceptance_rate, 3),
        "stagnation_risk": stagnation["risk"],
        "stagnation_signals": stagnation["signals"],
        "burnout_risk": "low" if days_since_activity < 3 and completion_rate < 0.8 else "none",
        "growth_acceleration": round(growth_velocity, 3),
        "execution_style": style,
        "days_since_activity": days_since_activity,
        "roadmap_mutations": roadmap_version,
        "completed_count": len(completed_nodes),
        "deferred_count": len(deferred_nodes),
    }


def _days_since(iso_str: str | None, now: datetime) -> int:
    if not iso_str:
        return 999
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return max(0, (now - dt).days)
    except (ValueError, TypeError):
        return 999


def _recency_score(days: int) -> float:
    if days <= 1: return 1.0
    if days <= 3: return 0.8
    if days <= 7: return 0.6
    if days <= 14: return 0.3
    return 0.1


def _detect_stagnation(days_inactive: int, days_no_upload: int, deferred_count: int,
                       completion_rate: float, total_actions: int, velocity: float) -> dict:
    signals = []
    risk = "none"

    if days_inactive > 14:
        signals.append({"cause": "inactivity", "detail": f"No activity for {days_inactive} days"})
    if deferred_count >= 4:
        signals.append({"cause": "repeated_deferrals", "detail": f"{deferred_count} roadmap items deferred"})
    if total_actions > 3 and completion_rate < 0.2:
        signals.append({"cause": "low_completion", "detail": "Very low completion rate despite engagement"})
    if velocity < 0.1 and total_actions > 0:
        signals.append({"cause": "low_velocity", "detail": "Growth velocity near zero"})
    if days_no_upload > 30:
        signals.append({"cause": "no_resume_updates", "detail": "No resume uploads in 30+ days"})

    if len(signals) >= 3:
        risk = "high"
    elif len(signals) >= 1:
        risk = "medium"

    return {"risk": risk, "signals": signals}


def _classify_execution_style(completion_rate: float, acceptance_rate: float,
                              days_inactive: int, velocity: float,
                              deferred_count: int, roadmap_version: int) -> str:
    if velocity >= 0.7 and completion_rate >= 0.6:
        return "sprinter"
    if roadmap_version >= 4 and completion_rate >= 0.5 and days_inactive <= 3:
        return "highly_disciplined"
    if acceptance_rate >= 0.7 and completion_rate >= 0.4:
        return "optimizer"
    if deferred_count >= 4 and completion_rate < 0.3:
        return "explorer"
    if days_inactive > 7 and completion_rate > 0.3:
        return "recovering"
    return "inconsistent"
