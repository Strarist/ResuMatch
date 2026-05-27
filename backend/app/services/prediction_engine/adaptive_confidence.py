from typing import Dict, Any
from app.services.prediction_engine.shared.confidence import ConfidenceVector
from app.services.prediction_engine.predictive_calibration import PredictiveCalibrationEngine

class AdaptiveConfidenceEngine:
    """Dynamically refines confidence models and prediction weights using past correctness data."""

    @classmethod
    def evaluate_adaptive_confidence(
        cls, metrics: Dict[str, Any], outreach_count: int, history_len: int
    ) -> Dict[str, Any]:
        """Calculates a calibrated confidence vector utilizing historical divergence coefficients."""
        # 1. Evaluate baseline confidence
        base_vector = ConfidenceVector.evaluate_state(metrics, outreach_count, history_len)
        base_dict = base_vector.to_dict()

        # 2. Retrieve calibration coefficients
        coeffs = PredictiveCalibrationEngine.get_calibration_coefficients()

        # 3. Apply calibration scaling
        adjusted_market = max(0.05, min(0.99, base_dict["market_signal_strength"] * coeffs["market_fit_coeff"]))
        adjusted_recruiter = max(0.05, min(0.99, base_dict["recruiter_signal_strength"] * coeffs["recruiter_conf_coeff"]))
        adjusted_reliability = max(0.05, min(0.99, base_dict["execution_reliability_score"] * coeffs["velocity_coeff"]))

        # 4. Re-calculate overall calibrated average
        calibrated_avg = round(
            (base_dict["data_density_score"] + adjusted_market + adjusted_recruiter + adjusted_reliability) / 4.0,
            2
        )

        return {
            "prediction_confidence": base_dict["prediction_confidence"],
            "data_density_score": base_dict["data_density_score"],
            "market_signal_strength": round(adjusted_market, 2),
            "recruiter_signal_strength": round(adjusted_recruiter, 2),
            "execution_reliability_score": round(adjusted_reliability, 2),
            "calibrated_confidence": calibrated_avg,
            "coefficients_applied": coeffs
        }
