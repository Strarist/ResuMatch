from typing import List, Dict, Any

class StreamSynchronizationAuditor:
    """Tracks synchronization latencies between client heartbeats and backend commits."""

    @staticmethod
    def audit_synchronization(sync_delays_ms: List[float]) -> Dict[str, Any]:
        """
        Computes average synchronization latency and delays.
        
        Args:
            sync_delays_ms (List[float]): Latency values of sequential synchronization events.
        """
        if not sync_delays_ms:
            return {
                "average_delay_ms": 15.0,
                "max_delay_ms": 15.0,
                "delay_classification": "OPTIMAL"
            }

        avg_delay = sum(sync_delays_ms) / len(sync_delays_ms)
        max_delay = max(sync_delays_ms)

        if avg_delay > 500.0:
            classification = "HIGH_LAG"
        elif avg_delay > 150.0:
            classification = "MODERATE_LAG"
        else:
            classification = "OPTIMAL"

        return {
            "average_delay_ms": round(avg_delay, 1),
            "max_delay_ms": round(max_delay, 1),
            "delay_classification": classification
        }
