from typing import Dict, Any, List

class PerformanceDegradationTracker:
    """Monitors performance benchmarks to calculate system degradation metrics."""

    @staticmethod
    def evaluate_degradation(latencies: List[float], baseline_latency: float = 15.0) -> Dict[str, Any]:
        """
        Gauges latency regressions against reference baselines.
        
        Args:
            latencies (List[float]): Chronological operational latencies (e.g. database query, API roundtrips).
            baseline_latency (float): Fast operational target baseline in ms.
        """
        if not latencies:
            return {
                "degradation_score": 0.0,
                "regression_factor": 1.0
            }

        avg_latency = sum(latencies) / len(latencies)
        
        # Calculate ratio of current latency to reference baseline
        ratio = avg_latency / baseline_latency
        
        # Map ratio to a degradation coefficient 0.0 to 1.0
        degradation = round(max(0.0, min(1.0, (ratio - 1.0) / 2.0)), 2)

        return {
            "degradation_score": degradation,
            "regression_factor": round(ratio, 2)
        }
