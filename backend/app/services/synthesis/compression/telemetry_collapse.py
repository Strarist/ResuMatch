from typing import Dict, Any, List

class TelemetryCollapser:
    """Collapses high-frequency metric listings into compressed baseline metrics."""

    @staticmethod
    def collapse_metric_trajectory(values: List[float]) -> float:
        """Returns the weighted moving average of trajectory values to represent baseline momentum."""
        if not values:
            return 0.0
        # Give higher weight to more recent weeks
        weights = [i + 1 for i in range(len(values))]
        weighted_sum = sum(v * w for v, w in zip(values, weights))
        return round(weighted_sum / sum(weights), 2)
