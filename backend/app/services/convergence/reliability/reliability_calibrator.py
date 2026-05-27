from typing import Dict, Any
from app.services.convergence.shared.calibration_protocols import ConvergenceProvider
from app.services.convergence.shared.convergence_models import ReliabilityCalibrationState
from app.services.convergence.reliability.trust_refinement import TrustRefinementManager
from app.services.convergence.reliability.resilience_optimizer import ResilienceOptimizer
from app.services.convergence.reliability.degradation_tuner import DegradationTuner

class ReliabilityCalibrationEngine(ConvergenceProvider):
    """Orchestrates trust index scoring calibrations, active connection pacers tuning, and degradation margins adjustments."""
    
    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs full reliability calibration.
        
        Args:
            data (Dict[str, Any]): Calibration metrics containing:
                - stability_factor (float): execution health scale.
                - stable_epochs (int): count of healthy execution cycles.
                - load_stability (float): workload factor.
        """
        stab_factor = data.get("stability_factor", 1.0)
        epochs = data.get("stable_epochs", 4)
        load_stab = data.get("load_stability", 0.75)
        
        # 1. Run sub-calibrations
        trust_info = TrustRefinementManager.refine_trust(stab_factor)
        res_info = ResilienceOptimizer.optimize_resilience(epochs)
        deg_info = DegradationTuner.tune_degradation(load_stab)
        
        state = ReliabilityCalibrationState(
            calibrated_trust_score=trust_info["calibrated_trust"],
            resilience_retry_cooldown_seconds=res_info["optimized_cooldown_seconds"],
            adjusted_degradation_latency_ms=deg_info["latency_limit_ms"],
            adjusted_degradation_memory_mb=deg_info["memory_limit_mb"],
            calibration_applied=trust_info["refinement_applied"] or epochs > 5,
            calibration_pacing_cooldown_active=epochs > 8
        )
        
        return state.model_dump()
