from typing import List, Dict, Any
from app.services.synthesis.shared.formatting import SynthesisFormatter

class ExecutionDeltaCalculator:
    """Calculates week-over-week execution delta metrics."""

    @staticmethod
    def calculate_weekly_delta(
        current_metrics: Dict[str, float],
        previous_metrics: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Computes absolute and percentage shifts for the strategic dashboard.
        
        Args:
            current_metrics (Dict[str, float]): Current week's metrics.
            previous_metrics (Dict[str, float]): Previous week's metrics.
        """
        cur_match = current_metrics.get("matchScore", 80.0)
        prev_match = previous_metrics.get("matchScore", 80.0)

        delta_str = SynthesisFormatter.format_delta(cur_match, prev_match)
        raw_pct = ((cur_match - prev_match) / prev_match) * 100.0 if prev_match != 0 else 0.0

        return {
            "execution_delta_percent": round(raw_pct, 2),
            "execution_delta_string": delta_str,
            "metrics_shifted": cur_match > prev_match
        }
