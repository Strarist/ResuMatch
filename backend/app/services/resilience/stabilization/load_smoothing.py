from typing import List, Dict, Any

class TelemetryLoadSmoother:
    """Filters burst payload spikes using moving average algorithms for load smoothing."""

    @staticmethod
    def smooth_latencies(raw_latencies: List[float]) -> Dict[str, Any]:
        """
        Smooths latency fluctuations.
        
        Args:
            raw_latencies (List[float]): Latency metrics from recent execution cycles.
        """
        if not raw_latencies:
            return {
                "smoothed_latency_ms": 15.0,
                "is_spiky": False
            }

        # Calculate average
        avg = sum(raw_latencies) / len(raw_latencies)
        
        # Spot spikes: if max latency exceeds average by 100%
        maximum = max(raw_latencies)
        is_spiky = maximum > (avg * 2.0)

        return {
            "smoothed_latency_ms": round(avg, 1),
            "is_spiky": is_spiky
        }
