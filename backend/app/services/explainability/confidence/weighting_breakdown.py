from typing import Dict, Any
from app.services.prediction_engine.predictive_calibration import PredictiveCalibrationEngine

class WeightingBreakdown:
    """Calculates active metric weighting variables and details their contributions to confidence."""

    @classmethod
    def get_active_weights(cls) -> Dict[str, Any]:
        """Exposes the active weight parameters, calibration coefficients, and relative contribution percentiles."""
        # 1. Retrieve calibration coefficients
        coeffs = PredictiveCalibrationEngine.get_calibration_coefficients()

        # 2. Define baseline weights for confidence computation (equal contribution baseline)
        baseline_weights = {
            "data_density": 0.25,
            "market_signal": 0.25,
            "recruiter_signal": 0.25,
            "execution_reliability": 0.25
        }

        # 3. Calculate calibrated weights based on coefficients (dynamic scaling)
        # Note: data_density doesn't have an explicit calibration coefficient, but the other three do
        raw_scaled = {
            "data_density": baseline_weights["data_density"],
            "market_signal": baseline_weights["market_signal"] * coeffs.get("market_fit_coeff", 1.0),
            "recruiter_signal": baseline_weights["recruiter_signal"] * coeffs.get("recruiter_conf_coeff", 1.0),
            "execution_reliability": baseline_weights["execution_reliability"] * coeffs.get("velocity_coeff", 1.0)
        }

        # Normalize to sum to 1.0
        total_scaled = sum(raw_scaled.values())
        calibrated_weights = {}
        for k, v in raw_scaled.items():
            calibrated_weights[k] = round(v / total_scaled, 3) if total_scaled > 0 else baseline_weights[k]

        return {
            "baseline_weights": baseline_weights,
            "calibration_coefficients": {
                "market_fit_coeff": coeffs.get("market_fit_coeff", 1.0),
                "recruiter_conf_coeff": coeffs.get("recruiter_conf_coeff", 1.0),
                "velocity_coeff": coeffs.get("velocity_coeff", 1.0),
                "match_score_coeff": coeffs.get("match_score_coeff", 1.0)
            },
            "calibrated_weights": calibrated_weights,
            "explanation": (
                f"Confidence is calculated using a 4-dimensional matrix. Baseline metrics are weighted equally (25% each). "
                f"Active calibration adjusts weights to: Data Density ({int(calibrated_weights['data_density']*100)}%), "
                f"Market Signal ({int(calibrated_weights['market_signal']*100)}%), "
                f"Recruiter Signal ({int(calibrated_weights['recruiter_signal']*100)}%), and "
                f"Execution Reliability ({int(calibrated_weights['execution_reliability']*100)}%) based on past prediction accuracy."
            )
        }
