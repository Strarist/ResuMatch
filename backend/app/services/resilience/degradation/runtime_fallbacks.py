from typing import Dict, Any

class RuntimeFallbackBroker:
    """Serves safe default metrics or cached state snapshots when subsystems are isolated."""

    @staticmethod
    def get_fallback_snapshot(component_name: str) -> Dict[str, Any]:
        """
        Yields static fallback data based on target component key.
        
        Args:
            component_name (str): Isolated component identifier.
        """
        if component_name == "Prediction Engine":
            return {
                "matchScore": 90.0,
                "careerVelocity": 75.0,
                "marketFit": 88.0,
                "recruiterConfidence": 80.0,
                "calibrated": False,
                "diagnostics": "Fallback mock predictor metrics in place due to boundary lockdown."
            }
        
        return {
            "status": "FALLBACK",
            "active": False,
            "timestamp_utc": 0
        }
