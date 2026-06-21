"""Recruiter Demand Graph — skill scarcity, frequency, and growth premiums."""

from typing import List, Dict, Any
from app.services.market_intelligence.engine import SKILL_MARKET_DATA

def compute_recruiter_demand_index(jobs: List[Dict[str, Any]], user_skills: List[str]) -> Dict[str, Dict[str, float]]:
    """
    Build Recruiter Demand Index based on crawled jobs and user skill profiles.
    Returns a dictionary mapping skill tags to their demand, growth, and scarcity scores.
    """
    # 1. Count skill frequency in crawled jobs
    frequency: Dict[str, int] = {}

    for job in jobs:
        # Check either tags or skills
        skills_required = job.get("skills") or job.get("tags") or []
        for s in skills_required:
            s_clean = s.lower().strip()
            frequency[s_clean] = frequency.get(s_clean, 0) + 1

    # Max frequency for normalization
    max_freq = max(frequency.values()) if frequency else 1

    # 2. Compute indexes for all known skills in SKILL_MARKET_DATA
    demand_graph: Dict[str, Dict[str, float]] = {}

    for skill, market_meta in SKILL_MARKET_DATA.items():
        # Skill frequency score
        freq_count = frequency.get(skill.lower(), 0)
        freq_score = freq_count / max_freq

        # Demand score: balance between crawled frequency and static market demand index
        crawled_demand = freq_score
        baseline_demand = market_meta.get("demand", 0.70)
        demand_score = float(round((crawled_demand * 0.40 + baseline_demand * 0.60), 2))

        # Growth score: based on trend and salary premium
        trend_weight = 0.20 if market_meta.get("trend") == "rising" else 0.05
        premium_weight = market_meta.get("salary_premium", 0.10)
        growth_score = float(round(min(1.0, (trend_weight + premium_weight) * 3), 2))

        # Scarcity score: depends on market saturation ("low" = high scarcity, "high" = low scarcity)
        saturation = market_meta.get("saturation", "medium")
        saturation_base = 0.85 if saturation == "low" else 0.50 if saturation == "medium" else 0.20

        scarcity_score = float(round(saturation_base, 2))

        demand_graph[skill] = {
            "demand_score": demand_score,
            "growth_score": growth_score,
            "scarcity_score": scarcity_score,
            "frequency_count": float(freq_count)
        }

    return demand_graph
