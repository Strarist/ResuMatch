from typing import List, Dict, Any

class MomentumSummaryEngine:
    """Tracks talent index progress velocity and learning momentum."""

    @staticmethod
    def evaluate_momentum(
        metric_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Extracts recent shipping frequency and scores to estimate velocity.
        
        Args:
            metric_history (List[Dict[str, Any]]): Chronological historical metrics list.
        """
        if not metric_history or len(metric_history) < 2:
            return {
                "momentum_trend": "STABLE",
                "learning_velocity": 0.5,
                "summary": "Execution velocity is constant. Dynamic pipeline remains balanced with no current drift."
            }

        # Analyze the trend across first and last elements
        first = metric_history[0].get("matchScore", 80.0)
        last = metric_history[-1].get("matchScore", 80.0)

        diff = last - first
        if diff > 3.0:
            trend = "ACCELERATING"
            velocity = 0.85
            desc = "Outreach and shipping trajectory is accelerating rapidly, boosting active recruiter pull."
        elif diff < -3.0:
            trend = "DECELERATING"
            velocity = 0.3
            desc = "Downturn in consistency has triggered minor trajectory deceleration. Re-engage shipping cycles."
        else:
            trend = "STABLE"
            velocity = 0.6
            desc = "Trajectory is highly stable, maintaining steady progress and baseline recruiter visibility."

        return {
            "momentum_trend": trend,
            "learning_velocity": velocity,
            "summary": desc
        }
