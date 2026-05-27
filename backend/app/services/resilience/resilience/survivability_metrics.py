from typing import Dict, Any

class DegradationStabilityScorer:
    """Surveys active degradation durations and calculates degradation stability coefficients."""

    @staticmethod
    def calculate_stability(degradation_duration_seconds: float, max_duration: float = 60.0) -> Dict[str, Any]:
        """
        Calculates degradation indexes based on active duration.
        
        Args:
            degradation_duration_seconds (float): Duration system remains in degraded state.
            max_duration (float): Maximum tolerable degraded window.
        """
        if degradation_duration_seconds <= 0.0:
            return {
                "degradation_stability": 1.0,
                "summary": "No active degradation profiles registered."
            }

        ratio = degradation_duration_seconds / max_duration
        
        # Longer duration reduces overall stability
        stability = round(max(0.1, 1.0 - ratio), 2)

        return {
            "degradation_stability": stability,
            "summary": f"System degraded for {degradation_duration_seconds}s. Stability index: {stability}."
        }
