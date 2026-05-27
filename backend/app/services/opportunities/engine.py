"""Opportunity Intelligence — matching, gap analysis, and radar.

Deterministic. Uses trajectory, recruiter profile, market, and execution data.
"""

from __future__ import annotations

from app.services.trajectory.engine import ROLE_TEMPLATES
from app.services.market_intelligence.engine import SKILL_MARKET_DATA


def compute_opportunity_matches(
    trajectory: dict,
    recruiter_profile: dict,
    execution_profile: dict,
    market: dict,
) -> list[dict]:
    """Generate ranked opportunity matches based on all intelligence signals."""
    readiness = trajectory.get("readiness_scores", {})
    specs = trajectory.get("specializations", {})
    hiring_conf = recruiter_profile.get("hiring_confidence", 0)
    portfolio_maturity = recruiter_profile.get("portfolio_maturity", "learning")
    momentum = execution_profile.get("momentum_score", 0)

    matches = []

    # Role-based opportunities (top 3 ready roles)
    for role, data in sorted(readiness.items(), key=lambda x: x[1]["score"], reverse=True)[:4]:
        if data["score"] < 0.3:
            continue
        proof_adjusted = recruiter_profile.get("role_fit", [])
        proof_score = next((r["proof_adjusted"] for r in proof_adjusted if r["role"] == role), data["score"] * 0.7)

        alignment = data["score"] * 0.3 + proof_score * 0.3 + hiring_conf * 0.2 + momentum * 0.2
        matches.append({
            "type": "full_time_role",
            "title": role,
            "organization": "Market-aligned roles",
            "alignment_score": round(min(1.0, alignment), 3),
            "confidence": round(proof_score, 3),
            "difficulty": "senior" if data["score"] >= 0.7 else "mid" if data["score"] >= 0.4 else "junior",
            "estimated_career_impact": "high" if alignment >= 0.6 else "medium",
            "matching_signals": data.get("matched_core", [])[:3],
            "missing_requirements": data.get("missing_core", [])[:3],
            "proof_gaps": [] if portfolio_maturity in ("production_ready", "scalable", "differentiated") else ["deployment proof needed"],
            "urgency": "high" if alignment >= 0.7 else "medium",
        })

    # Certification opportunities (based on market ROI)
    high_roi = market.get("high_value_missing", [])[:2]
    for skill_data in high_roi:
        matches.append({
            "type": "certification",
            "title": f"{skill_data['skill'].title()} Certification",
            "organization": "Industry certification",
            "alignment_score": round(skill_data["roi_score"], 3),
            "confidence": round(skill_data["demand"], 3),
            "difficulty": "intermediate",
            "estimated_career_impact": "medium",
            "matching_signals": [f"+{int(skill_data['salary_premium']*100)}% salary premium"],
            "missing_requirements": [skill_data["skill"]],
            "proof_gaps": [],
            "urgency": "medium" if skill_data.get("trend") == "rising" else "low",
        })

    # Open source opportunity (if specialization is strong)
    dominant_specs = [(d, s) for d, s in specs.items() if s.get("strength", 0) >= 0.4]
    if dominant_specs:
        domain, spec = dominant_specs[0]
        matches.append({
            "type": "open_source",
            "title": f"Contribute to {domain.title()} open-source projects",
            "organization": "Open source ecosystem",
            "alignment_score": round(spec["strength"] * 0.8, 3),
            "confidence": round(spec["strength"], 3),
            "difficulty": "intermediate",
            "estimated_career_impact": "medium",
            "matching_signals": spec.get("skills", [])[:3],
            "missing_requirements": [],
            "proof_gaps": [] if recruiter_profile.get("deployed_count", 0) > 0 else ["public contribution history"],
            "urgency": "low",
        })

    matches.sort(key=lambda m: m["alignment_score"], reverse=True)
    return matches[:6]


def compute_opportunity_gaps(trajectory: dict, recruiter_profile: dict) -> list[dict]:
    """Compute gap-to-opportunity intelligence for top roles."""
    readiness = trajectory.get("readiness_scores", {})
    role_fit = recruiter_profile.get("role_fit", [])
    gaps = []

    for fit in role_fit[:4]:
        role = fit["role"]
        role_data = readiness.get(role, {})
        missing_skills = role_data.get("missing_core", [])
        proof_adjusted = fit["proof_adjusted"]
        skill_readiness = fit["skill_readiness"]

        # Determine missing proof
        missing_proof = []
        if recruiter_profile.get("portfolio_maturity") in ("learning", "functional"):
            missing_proof.append("deployed project demonstrating skills")
        if recruiter_profile.get("deployment_maturity", 0) < 0.4:
            missing_proof.append("production deployment evidence")

        gaps.append({
            "target_role": role,
            "readiness_percentage": round(proof_adjusted * 100, 1),
            "skill_readiness": round(skill_readiness * 100, 1),
            "missing_skills": missing_skills[:3],
            "missing_proof": missing_proof[:2],
            "estimated_completion_time": f"{max(1, len(missing_skills) * 3)} weeks" if missing_skills else "Ready",
            "recruiter_impact": "high" if proof_adjusted >= 0.5 else "medium",
        })

    return gaps


def compute_opportunity_radar(trajectory: dict, market: dict, execution_profile: dict) -> dict:
    """Surface high-value opportunities dynamically."""
    specs = trajectory.get("specializations", {})
    roi_skills = market.get("roi_skills", [])
    salary = market.get("salary_trajectory", {})

    # Emerging domains (user has momentum in)
    emerging = [d for d, s in specs.items() if s.get("emerging")]

    # High ROI skills
    high_roi = [{"skill": s["skill"], "roi": s["roi_score"], "trend": s["trend"]} for s in roi_skills[:5] if s["roi_score"] >= 0.5]

    # Salary growth paths
    salary_paths = []
    if salary.get("growth_potential") == "high":
        salary_paths.append("Current trajectory supports strong salary growth")
    for s in roi_skills[:3]:
        if s["salary_premium"] >= 0.15:
            salary_paths.append(f"{s['skill'].title()}: +{int(s['salary_premium']*100)}% premium")

    # Underutilized strengths
    underutilized = []
    for domain, spec in specs.items():
        if spec.get("dominant") and spec.get("momentum", 0) < 0.2:
            underutilized.append(f"{domain.title()} — strong but inactive")

    return {
        "emerging_domains": emerging,
        "high_roi_skills": high_roi,
        "salary_growth_paths": salary_paths[:4],
        "underutilized_strengths": underutilized,
        "momentum": execution_profile.get("momentum_score", 0),
    }
