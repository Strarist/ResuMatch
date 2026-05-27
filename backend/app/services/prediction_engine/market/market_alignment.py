from typing import Dict, Any, List

class MarketAlignmentModel:
    """Measures alignment between user stack and domain trends."""

    @staticmethod
    def evaluate_alignment(skills: List[str], metrics: dict) -> Dict[str, Any]:
        fit = metrics.get("marketFit", 91.0)

        # Calculate premium skill match ratio
        hot_skills = {"fastapi", "next.js", "typescript", "python", "docker", "redis", "postgresql", "kubernetes"}
        matched = [s for s in skills if s.lower() in hot_skills]

        match_percentage = min(99.0, fit + (len(matched) * 2.0))

        return {
            "market_alignment_score": round(match_percentage, 1),
            "matched_trending_skills": matched,
            "gap_count": max(0, 5 - len(matched)),
            "leverage_coefficient": round(match_percentage / 100.0, 2)
        }
