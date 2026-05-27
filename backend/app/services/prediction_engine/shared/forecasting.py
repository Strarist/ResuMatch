from typing import List, Dict, Any
from app.services.prediction_engine.shared.scoring import calculate_growth, calculate_decay

class TrendForecaster:
    """Utility for generating time-series projections based on growth/decay parameters."""

    @staticmethod
    def project_trend(
        base_value: float,
        rate: float,
        steps: int,
        is_growth: bool = True,
        cap: float = 100.0
    ) -> List[float]:
        projections = []
        for i in range(1, steps + 1):
            if is_growth:
                val = calculate_growth(base_value, rate, cap, i)
            else:
                val = calculate_decay(base_value, rate, i)
            projections.append(round(val, 2))
        return projections
