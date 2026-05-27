"""Strategic Analytics Engine — longitudinal growth analysis."""

from __future__ import annotations


def compute_analytics_snapshot(
    execution_profile: dict,
    trajectory: dict,
    recruiter_profile: dict,
    reputation: dict,
) -> dict:
    """Generate analytics snapshot for growth trends."""
    return {
        "growth_velocity": execution_profile.get("growth_acceleration", 0),
        "trajectory_stability": 1.0 if not trajectory.get("drift_detected") else 0.5,
        "specialization_momentum": max(
            (s.get("momentum", 0) for s in trajectory.get("specializations", {}).values()), default=0
        ),
        "execution_trend": execution_profile.get("momentum_score", 0),
        "roadmap_completion_trend": execution_profile.get("completion_velocity", 0),
        "opportunity_alignment_trend": recruiter_profile.get("recruiter_readiness", 0),
        "recruiter_trust_growth": reputation.get("recruiter_trust_trend", 0),
        "execution_style": execution_profile.get("execution_style", "unknown"),
        "dominant_path": trajectory.get("dominant_path", "Unknown"),
        "competitiveness": trajectory.get("competitiveness_score", 0),
    }
