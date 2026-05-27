from typing import Dict, Any, List

class CycleDiagnosticsMonitor:
    """Measures execution latency and maps cycles that experience degradation."""

    @staticmethod
    def audit_cycle(latency_ms: float, baseline_ms: float = 120.0) -> Dict[str, Any]:
        """
        Analyzes loop cycles for excessive delay patterns.
        
        Args:
            latency_ms (float): Current cycle execution duration in milliseconds.
            baseline_ms (float): Normal latency threshold.
        """
        is_degraded = latency_ms > (baseline_ms * 1.5)
        
        # Calculate deviation index
        deviation = max(0.0, (latency_ms - baseline_ms) / baseline_ms)
        cycle_coherence = max(0.1, round(1.0 - (deviation * 0.4), 2))

        return {
            "latency_ms": latency_ms,
            "is_degraded": is_degraded,
            "coherence_coefficient": cycle_coherence,
            "latency_classification": "DEGRADED" if is_degraded else "OPTIMAL"
        }
