from typing import List, Dict, Any
from app.services.prediction_engine.shared.forecasting import TrendForecaster

class DemandProjector:
    """Projects volume of job postings and demand cycles over future months."""

    @staticmethod
    def project_volume(base_volume: int, growth_rate: float, months: int = 12) -> List[Dict[str, Any]]:
        trend = TrendForecaster.project_trend(float(base_volume), growth_rate, months, is_growth=True)

        projected = []
        for i, val in enumerate(trend):
            projected.append({
                "month": i + 1,
                "volume": int(val),
                "growth_percentage": f"+{((val - base_volume) / base_volume) * 100:0.1f}%" if base_volume > 0 else "0%"
            })
        return projected
