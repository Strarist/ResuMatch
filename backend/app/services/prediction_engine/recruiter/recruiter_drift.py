from typing import List
from app.services.prediction_engine.shared.forecasting import TrendForecaster

class RecruiterDriftModel:
    """Predicts how profile search visibility decays when inactivity sets in."""

    @staticmethod
    def project_visibility_decay(base_visibility: float, weeks_inactive: int = 12) -> List[float]:
        # Decay at 4% weekly rate
        return TrendForecaster.project_trend(base_visibility, 0.04, weeks_inactive, is_growth=False)
