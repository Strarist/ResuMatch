from typing import Dict, Any

class DegradationProfilesManager:
    """Configures specific degradation profile behaviors based on stress ratios."""

    @staticmethod
    def resolve_profile(stress_ratio: float) -> Dict[str, Any]:
        """
        Maps a stress ratio to a specific degradation profile.
        
        Args:
            stress_ratio (float): Aggregated stress factor (0.0 to 1.0).
        """
        if stress_ratio >= 0.8:
            return {
                "profile_name": "MINIMAL",
                "expensive_telemetry_disabled": True,
                "synthesis_density": "MINIMAL",
                "prediction_pacing_seconds": 30.0,
                "transport_broadcast_rate": 0.2
            }
        elif stress_ratio >= 0.4:
            return {
                "profile_name": "COMPRESSED",
                "expensive_telemetry_disabled": True,
                "synthesis_density": "COMPRESSED",
                "prediction_pacing_seconds": 15.0,
                "transport_broadcast_rate": 0.5
            }
        else:
            return {
                "profile_name": "OPTIMAL",
                "expensive_telemetry_disabled": False,
                "synthesis_density": "FULL",
                "prediction_pacing_seconds": 5.0,
                "transport_broadcast_rate": 1.0
            }
