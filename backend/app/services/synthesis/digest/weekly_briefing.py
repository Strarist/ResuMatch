from typing import Dict, Any, List

class WeeklyBriefingEngine:
    """Outlines high-level target focus parameters for the weekly briefings."""

    @staticmethod
    def generate_briefing(
        metrics: Dict[str, float],
        improved_skills: List[str]
    ) -> Dict[str, Any]:
        """
        Creates actionable weekly briefing descriptions.
        
        Args:
            metrics (Dict[str, float]): Trajectory metrics.
            improved_skills (List[str]): List of newly acquired or targeted skills.
        """
        recruiter_confidence = metrics.get("recruiterConfidence", 80.0)
        market_fit = metrics.get("marketFit", 80.0)

        # Formulate core weekly recommendation
        if recruiter_confidence < 80.0:
            rec = "Prioritize outbound outreach cycles and optimize high-value response rates."
            focus = "Recruiter Outbound Acceleration"
        elif market_fit < 85.0:
            rec = "Target high-leverage systems-level skills like FastAPI and Kubernetes."
            focus = "Market Fit Optimization"
        else:
            rec = "Stabilize active pipelines and validate current sandbox simulations."
            focus = "Trajectory Stabilization"

        return {
            "strategic_focus_recommendation": rec,
            "focus_area": focus,
            "weekly_summary": f"Trajectory focal area: {focus}. Active recommendation: {rec}"
        }
