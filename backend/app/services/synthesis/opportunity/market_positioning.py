from typing import Dict, Any, List
from app.services.synthesis.shared.synthesis_rules import DOMAIN_SPECIALIZATION_KEYWORDS

class MarketPositioningEngine:
    """Maps technical skills, market demand volumes, and compensation to market fit metrics."""

    @staticmethod
    def evaluate_market_positioning(
        improved_skills: List[str],
        metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Synthesizes technical alignment with active market demand signals.
        
        Args:
            improved_skills (List[str]): List of newly acquired or targeted skills.
            metrics (Dict[str, float]): Core execution metrics containing marketFit.
        """
        market_fit = metrics.get("marketFit", 80.0)

        # Match skills to domain specialization names
        specializations = []
        for skill in improved_skills:
            key = skill.lower()
            if key in DOMAIN_SPECIALIZATION_KEYWORDS:
                specializations.append(DOMAIN_SPECIALIZATION_KEYWORDS[key])
        
        if not specializations:
            specializations.append("Full-Stack Software Architecture")

        # Demand Index 0-100: based on market fit and skill coverage
        base_demand = market_fit
        skill_coverage_bonus = min(20.0, len(improved_skills) * 4.0)
        market_demand_index = round(min(100.0, base_demand + skill_coverage_bonus), 1)

        return {
            "market_demand_index": market_demand_index,
            "target_specialization": specializations[0],
            "all_specializations": specializations,
            "positioning_summary": f"Strong alignment in {specializations[0]} with a market demand index of {market_demand_index}%."
        }
