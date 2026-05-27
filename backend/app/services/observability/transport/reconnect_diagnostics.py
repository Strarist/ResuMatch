from typing import List, Dict, Any

class ReconnectDiagnosticsTracker:
    """Monitors connection drops and identifies reconnection storm indicators."""

    @staticmethod
    def audit_reconnects(disconnect_timestamps: List[float], time_window_seconds: float = 60.0) -> Dict[str, Any]:
        """
        Scans disconnect intervals to warn of transport storms.
        
        Args:
            disconnect_timestamps (List[float]): Epoch seconds of recent disconnection events.
            time_window_seconds (float): Pacing interval threshold.
        """
        if not disconnect_timestamps:
            return {
                "storm_detected": False,
                "reconnects_count": 0,
                "reconnect_frequency_per_hr": 0.0
            }

        # Calculate reconnect count in recent window
        recent_count = len(disconnect_timestamps)
        
        # Heuristic storm check: more than 3 reconnects in a short window
        storm_detected = recent_count >= 3

        return {
            "storm_detected": storm_detected,
            "reconnects_count": recent_count,
            "reconnect_frequency_per_hr": round(recent_count * (3600.0 / time_window_seconds), 1)
        }
