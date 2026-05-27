from typing import Dict, Any

class StrategicSummaryEngine:
    """Compiles high-level strategic summaries based on metrics and calibration settings."""

    @staticmethod
    def compile_strategic_summary(
        metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Synthesizes the core executive summary of the portfolio positioning.
        
        Args:
            metrics (Dict[str, float]): Trajectory metrics.
        """
        match_score = metrics.get("matchScore", 80.0)
        career_velocity = metrics.get("careerVelocity", 80.0)

        if match_score >= 90.0 and career_velocity >= 80.0:
            positioning = "Market Leading Strategy: Core competencies align directly with prime cloud-native opportunities."
            direction = "Accelerate advanced system design and distributed SSE integrations."
        else:
            positioning = "Emergent Strategy: Solid foundation established, with minor gaps in high-velocity container pipelines."
            direction = "Prioritize containerization architectures and target mid-stage startup outreach."

        return {
            "current_positioning": positioning,
            "strongest_leverage_direction": direction
        }
