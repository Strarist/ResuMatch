from typing import List, Dict, Any

class ConfidenceDecayTracker:
    """Evaluates prediction confidence degradation vectors across calibration phases."""

    @staticmethod
    def calculate_decay(confidence_history: List[float]) -> Dict[str, Any]:
        """
        Calculates degradation levels based on sequential confidence ratings.
        
        Args:
            confidence_history (List[float]): Chronological values of past prediction confidence coefficients.
        """
        if not confidence_history or len(confidence_history) < 2:
            return {
                "decay_rate": 0.0,
                "is_decaying": False,
                "summary": "Confidence levels stable over tracking window."
            }

        # Calculate difference between first and last recorded confidence levels
        first = confidence_history[0]
        last = confidence_history[-1]
        
        diff = first - last
        decay_rate = round(max(0.0, diff), 2)

        return {
            "decay_rate": decay_rate,
            "is_decaying": decay_rate > 0.05,
            "summary": f"Confidence decay rate stands at {decay_rate * 100}% over the calibration window."
        }
