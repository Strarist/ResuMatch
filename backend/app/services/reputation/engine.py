"""Reputation Engine — tracks credibility evolution over time."""

from __future__ import annotations


def compute_reputation(
    execution_profile: dict,
    recruiter_profile: dict,
    trajectory: dict,
    portfolio_maturity: str,
) -> dict:
    """Compute reputation profile from longitudinal signals."""
    momentum = execution_profile.get("momentum_score", 0)
    consistency = execution_profile.get("execution_consistency", 0)
    hiring_conf = recruiter_profile.get("hiring_confidence", 0)
    production = recruiter_profile.get("production_readiness", 0)
    differentiation = recruiter_profile.get("differentiation_score", 0)
    competitiveness = trajectory.get("competitiveness_score", 0)

    # Composite reputation
    score = (
        hiring_conf * 0.25 +
        consistency * 0.2 +
        production * 0.2 +
        differentiation * 0.15 +
        competitiveness * 0.1 +
        momentum * 0.1
    )

    maturity_bonus = {"differentiated": 0.15, "scalable": 0.1, "production_ready": 0.05}.get(portfolio_maturity, 0)
    score = min(1.0, score + maturity_bonus)

    return {
        "reputation_score": round(score, 3),
        "growth_consistency": round(consistency, 3),
        "execution_reliability": round(momentum * 0.5 + consistency * 0.5, 3),
        "proof_growth_rate": round(production, 3),
        "specialization_stability": round(differentiation, 3),
        "recruiter_trust_trend": round(hiring_conf, 3),
        "ecosystem_credibility": round(score * 0.8 + competitiveness * 0.2, 3),
    }
