from typing import Dict, Any, List
from app.services.synthesis.shared.synthesis_rules import LEVERAGE_ACCELERATION_COEFF

class LeverageSummaryEngine:
    """Highlights highest-leverage roadmap nodes and dynamic acceleration factors."""

    @staticmethod
    def identify_leverage_points(
        metrics: Dict[str, float],
        improved_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Analyzes the metrics and skill changes to pinpoint leverage points.
        
        Args:
            metrics (Dict[str, float]): Dynamic execution metrics.
            improved_skills (List[str]): List of newly acquired or targeted skills.
        """
        market_fit = metrics.get("marketFit", 80.0)
        career_velocity = metrics.get("careerVelocity", 75.0)

        # Base multiplier calculations
        base_multiplier = 1.0 + (market_fit / 100.0) * LEVERAGE_ACCELERATION_COEFF
        skill_bonus = len(improved_skills) * 0.15
        compound_leverage = round(base_multiplier + skill_bonus, 2)

        # Map leverage milestones
        leverage_milestones = []
        if "fastapi" in [s.lower() for s in improved_skills] or market_fit > 85:
            leverage_milestones.append("Realtime SSE API Node Optimization")
        if "systems" in [s.lower() for s in improved_skills] or career_velocity > 80:
            leverage_milestones.append("Distributed Trajectory Orchestration Sync")
        if not leverage_milestones:
            leverage_milestones.append("Core Platform Trajectory Stabilization")

        return {
            "compound_leverage_multiplier": compound_leverage,
            "leverage_milestones": leverage_milestones,
            "acceleration_factor": round(compound_leverage * 1.25, 2),
            "synthesis_summary": f"High leverage detected. Shifting from reactive orchestration to active strategic positioning with a {compound_leverage}x multiplier."
        }
