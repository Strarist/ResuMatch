"""Recruiter Intelligence Engine — proof-based credibility scoring.

Combines: skills + execution + portfolio proof + specialization maturity.
"""

from __future__ import annotations

from app.services.portfolio.proof_engine import compute_portfolio_maturity


def compute_recruiter_profile(
    trajectory: dict,
    execution_profile: dict,
    portfolio_projects: list[dict],
    market: dict,
    user_skills: list[str],
) -> dict:
    """Generate full recruiter intelligence profile."""
    specs = trajectory.get("specializations", {})
    readiness = trajectory.get("readiness_scores", {})
    attractiveness = market.get("recruiter_attractiveness", {})

    # Portfolio maturity
    portfolio = compute_portfolio_maturity(portfolio_projects)

    # Execution credibility
    exec_credibility = min(1.0, (
        execution_profile.get("momentum_score", 0) * 0.3 +
        execution_profile.get("completion_velocity", 0) * 0.4 +
        execution_profile.get("execution_consistency", 0) * 0.3
    ))

    # Specialization strength (dominant domain depth)
    dominant_specs = [(d, s) for d, s in specs.items() if s.get("dominant") or s.get("strength", 0) >= 0.5]
    spec_strength = max((s["strength"] for _, s in dominant_specs), default=0.0)

    # Technical depth (skill count + confidence)
    tech_depth = min(1.0, len(user_skills) / 12)

    # Stack coherence
    stack_coherence = attractiveness.get("stack_coherence", 0)

    # Deployment maturity (from portfolio)
    deployment_maturity = portfolio["avg_readiness"] if portfolio["project_count"] > 0 else 0.0

    # Production readiness (portfolio + execution)
    production_readiness = portfolio["score"] * 0.6 + exec_credibility * 0.4

    # Differentiation (specialization + portfolio uniqueness)
    differentiation = spec_strength * 0.5 + portfolio["score"] * 0.3 + tech_depth * 0.2

    # Hiring confidence (composite)
    hiring_confidence = (
        production_readiness * 0.25 +
        exec_credibility * 0.2 +
        spec_strength * 0.2 +
        deployment_maturity * 0.15 +
        stack_coherence * 0.1 +
        tech_depth * 0.1
    )

    # Strongest signals
    signals = _identify_strongest_signals(portfolio_projects, specs, execution_profile)

    # Hiring risks
    risks = _identify_hiring_risks(portfolio, execution_profile, specs, user_skills)

    # Role fit
    role_fit = _compute_role_fit(readiness, portfolio)

    return {
        "recruiter_readiness": round(hiring_confidence, 3),
        "portfolio_strength": portfolio["score"],
        "portfolio_maturity": portfolio["level"],
        "execution_credibility": round(exec_credibility, 3),
        "specialization_strength": round(spec_strength, 3),
        "differentiation_score": round(differentiation, 3),
        "hiring_confidence": round(hiring_confidence, 3),
        "production_readiness": round(production_readiness, 3),
        "technical_depth": round(tech_depth, 3),
        "stack_coherence": round(stack_coherence, 3),
        "deployment_maturity": round(deployment_maturity, 3),
        "strongest_signals": signals,
        "hiring_risks": risks,
        "role_fit": role_fit,
        "project_count": portfolio["project_count"],
        "deployed_count": portfolio.get("deployed_count", 0),
    }


def _identify_strongest_signals(projects: list[dict], specs: dict, execution: dict) -> list[str]:
    signals = []
    if any(p.get("live_url") for p in projects):
        signals.append("Has deployed production projects")
    if any(p.get("ci_cd_present") for p in projects):
        signals.append("CI/CD pipeline experience demonstrated")
    dominant = [d for d, s in specs.items() if s.get("dominant")]
    if dominant:
        signals.append(f"Strong {dominant[0]} specialization")
    if execution.get("execution_style") in ("sprinter", "highly_disciplined"):
        signals.append("Consistent execution track record")
    if any(p.get("ai_features_present") for p in projects):
        signals.append("AI/ML integration experience")
    return signals[:5]


def _identify_hiring_risks(portfolio: dict, execution: dict, specs: dict, skills: list[str]) -> list[str]:
    risks = []
    if portfolio["project_count"] == 0:
        risks.append("No portfolio projects to verify skills")
    elif portfolio["deployed_count"] == 0:
        risks.append("No deployed projects — skills unverified in production")
    if execution.get("execution_style") == "inconsistent":
        risks.append("Inconsistent execution pattern")
    if len(specs) >= 4 and all(s.get("strength", 0) < 0.4 for s in specs.values()):
        risks.append("Fragmented skill set without clear specialization")
    if portfolio["level"] in ("learning", "functional"):
        risks.append("Portfolio maturity below production-ready threshold")
    return risks[:4]


def _compute_role_fit(readiness: dict, portfolio: dict) -> list[dict]:
    """Top roles with proof-adjusted readiness."""
    proof_factor = min(1.0, portfolio["score"] * 1.5) if portfolio["project_count"] > 0 else 0.5
    fits = []
    for role, data in sorted(readiness.items(), key=lambda x: x[1]["score"], reverse=True)[:5]:
        adjusted = round(data["score"] * 0.6 + data["score"] * proof_factor * 0.4, 3)
        fits.append({"role": role, "skill_readiness": data["score"], "proof_adjusted": adjusted, "missing": data.get("missing_core", [])[:2]})
    return fits
