from typing import Dict, Any
from app.services.resilience.shared.containment_rules import MAX_EXPONENTIAL_RECONNECT_PACE

class TransportReconnectRestorer:
    """Calculates back-off pacing curves for stream re-connections to prevent storms."""

    @staticmethod
    def calculate_backoff(retry_count: int, base_seconds: float = 2.0) -> Dict[str, Any]:
        """
        Calculates exponential back-off wait times.
        
        Args:
            retry_count (int): Dynamic consecutive reconnection failure incidents.
            base_seconds (float): Pacing multiplier base.
        """
        if retry_count <= 0:
            return {
                "backoff_seconds": 0.0,
                "reconnect_priority": "IMMEDIATE"
            }

        # Exponential math: 2^retry * base
        calculated = base_seconds * (2 ** (retry_count - 1))
        backoff = round(min(MAX_EXPONENTIAL_RECONNECT_PACE, calculated), 1)

        priority = "HIGH"
        if backoff >= 60.0:
            priority = "LOW"
        elif backoff >= 10.0:
            priority = "MEDIUM"

        return {
            "backoff_seconds": backoff,
            "reconnect_priority": priority
        }
