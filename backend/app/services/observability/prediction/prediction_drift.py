from typing import Dict, Any
from app.services.observability.shared.diagnostics_protocols import DiagnosticsProvider
from app.services.observability.shared.observability_models import PredictionDrift
from app.services.observability.prediction.confidence_decay import ConfidenceDecayTracker
from app.services.observability.prediction.calibration_integrity import CalibrationIntegrityAuditor
from app.services.observability.prediction.simulation_consistency import SimulationConsistencyMonitor

class PredictionDriftMonitor(DiagnosticsProvider):
    """Main coordinator tracking forecast divergence, confidence decay, and calibration stability."""

    def diagnose(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs prediction drift diagnostics and checks calibration shifts.
        
        Args:
            data (Dict[str, Any]): Predictor diagnostics payload containing:
                - confidence_history (List[float]): Historical confidence values.
                - predicted_metrics (Dict[str, float]): Predicted score forecasts.
                - actual_metrics (Dict[str, float]): Realized tracking outputs.
                - simulation_runs (List[Dict[str, Any]]): Repeated simulation listings.
        """
        confidence_history = data.get("confidence_history", [0.9, 0.88, 0.85])
        predicted_metrics = data.get("predicted_metrics", {"matchScore": 94.0})
        actual_metrics = data.get("actual_metrics", {"matchScore": 91.0})
        simulation_runs = data.get("simulation_runs", [])

        # 1. Run sub-monitors
        decay_info = ConfidenceDecayTracker.calculate_decay(confidence_history)
        calibration_info = CalibrationIntegrityAuditor.audit_calibration(predicted_metrics, actual_metrics)
        consistency_info = SimulationConsistencyMonitor.evaluate_consistency(simulation_runs)

        # 2. Compute overall drift coefficient
        drift_coeff = round(
            (decay_info["decay_rate"] * 0.4) +
            ((1.0 - calibration_info["calibration_integrity"]) * 0.4) +
            ((1.0 - consistency_info["consistency_score"]) * 0.2),
            2
        )

        drift = PredictionDrift(
            drift_coefficient=drift_coeff,
            confidence_decay_rate=decay_info["decay_rate"],
            calibration_stability=calibration_info["calibration_integrity"],
            drift_diagnostics=(
                f"{decay_info['summary']} "
                f"Calibration stability score is {int(calibration_info['calibration_integrity']*100)}% "
                f"with a simulation consistency index of {int(consistency_info['consistency_score']*100)}%."
            )
        )

        return drift.model_dump()
