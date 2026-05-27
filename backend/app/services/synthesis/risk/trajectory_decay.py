from typing import Dict, Any

class TrajectoryDecayEngine:
    """Evaluates long-term trajectory visibility and talent index erosion rates."""

    @staticmethod
    def calculate_decay(
        metrics: Dict[str, float],
        weeks_inactive: int = 4
    ) -> Dict[str, Any]:
        """
        Evaluates risk of trajectory decay based on activity gaps.
        
        Args:
            metrics (Dict[str, float]): Trajectory metrics.
            weeks_inactive (int): Number of weeks since the last major milestone change or outreach.
        """
        recruiter_confidence = metrics.get("recruiterConfidence", 80.0)

        # Decay is direct function of weeks inactive and baseline confidence
        decay_rate = round(min(0.8, (weeks_inactive * 0.08) * (1.0 + (100.0 - recruiter_confidence) / 100.0)), 2)

        triggers = []
        actions = []

        if weeks_inactive > 2:
            triggers.append(f"Outreach dormancy exceeding {weeks_inactive} weeks")
            actions.append("Trigger automated resume pipeline rebuild and refresh profile keywords")

        return {
            "decay_rate": decay_rate,
            "triggers": triggers,
            "reconstruction_actions": actions
        }
