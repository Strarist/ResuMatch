from typing import Dict, Any

class AdaptiveThrottler:
    """Computes dynamic event rates and adaptive throttle pacing to safeguard transport channels."""

    @staticmethod
    def audit_throttle(request_rate: float, max_rate: float = 50.0) -> Dict[str, Any]:
        """
        Determines if incoming triggers exceed safe pacing limits.
        
        Args:
            request_rate (float): Requests per second.
            max_rate (float): Safe request boundary.
        """
        ratio = request_rate / max_rate
        should_throttle = ratio >= 0.90
        
        throttle_percentage = round(min(1.0, max(0.0, (ratio - 0.70) / 0.30)), 2) if ratio >= 0.70 else 0.0

        return {
            "request_rate": request_rate,
            "max_rate": max_rate,
            "should_throttle": should_throttle,
            "throttle_percentage": throttle_percentage
        }
