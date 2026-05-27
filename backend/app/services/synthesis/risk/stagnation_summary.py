from typing import Dict, Any
from app.services.synthesis.shared.synthesis_rules import (
    STAGNATION_THRESHOLD_HIGH,
    STAGNATION_THRESHOLD_MEDIUM
)

class StagnationSummaryEngine:
    """Evaluates execution consistency rates and consecutive stagnant days."""

    @staticmethod
    def calculate_stagnation(
        metrics: Dict[str, float],
        execution_consistency: float,
        consecutive_stagnant_days: int = 0
    ) -> Dict[str, Any]:
        """
        Calculates stagnation coefficients and provides targeted diagnostics.
        
        Args:
            metrics (Dict[str, float]): Trajectory metrics.
            execution_consistency (float): Execution consistency rate (0.0 to 1.0).
            consecutive_stagnant_days (int): Number of days without shipping or active outreach.
        """
        # Base stagnation coefficient is higher if consistency is low
        base_stagnation = 1.0 - execution_consistency
        stagnant_days_penalty = min(0.4, consecutive_stagnant_days * 0.03)
        stagnation_coefficient = round(min(1.0, base_stagnation + stagnant_days_penalty), 2)

        # Risk level determination based on thresholds
        if stagnation_coefficient >= STAGNATION_THRESHOLD_HIGH:
            level = "CRITICAL"
            brief = "Severe stagnation detected. Lack of consistent updates threatens overall pipeline validity."
        elif stagnation_coefficient >= STAGNATION_THRESHOLD_MEDIUM:
            level = "MEDIUM"
            brief = "Moderate stagnation. Trajectory velocity shows moderate deceleration; active shipping cycles needed."
        else:
            level = "LOW"
            brief = "Stagnation risk is low. Execution consistency remains robust across active milestones."

        return {
            "stagnation_coefficient": stagnation_coefficient,
            "risk_level": level,
            "diagnostics_brief": brief,
            "stagnant_triggers": ["Low consistency rate"] if execution_consistency < 0.7 else []
        }
