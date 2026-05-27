from typing import List, Dict, Any
from app.services.prediction_engine.shared.forecasting import TrendForecaster

class ExecutionProjector:
    """Projects future execution velocity and consistency curves."""

    @staticmethod
    def project_velocity(base_velocity: float, consistency: float, weeks: int = 12) -> List[float]:
        # High consistency leads to growth; low consistency leads to decay
        if consistency >= 0.7:
            rate = (consistency - 0.5) * 0.05
            return TrendForecaster.project_trend(base_velocity, rate, weeks, is_growth=True, cap=99.0)
        else:
            rate = (0.7 - consistency) * 0.03
            return TrendForecaster.project_trend(base_velocity, rate, weeks, is_growth=False)

    @staticmethod
    def project_leverage_curve(base_leverage: float, projects: int, weeks: int = 12) -> List[Dict[str, Any]]:
        """Maps estimated leverage growth curves."""
        curve = []
        for week in range(1, weeks + 1):
            project_factor = min(3, projects) * 1.5 * (week / weeks)
            current_leverage = min(99.0, base_leverage + (week * 0.4) + project_factor)
            curve.append({
                "week": week,
                "leverage": round(current_leverage, 1),
                "leverage_gain": f"+{current_leverage - base_leverage:0.1f}%"
            })
        return curve
