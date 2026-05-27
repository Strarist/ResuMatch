from typing import Dict, Any, List
from app.services.resilience.shared.resilience_protocols import ResilienceProvider
from app.services.resilience.shared.resilience_models import ResilienceVector
from app.services.resilience.shared.containment_rules import RESILIENCE_WEIGHTS
from app.services.resilience.resilience.survivability_metrics import DegradationStabilityScorer
from app.services.resilience.resilience.instability_tracker import InstabilityIncidentTracker
from app.services.resilience.resilience.recovery_quality import RecoveryQualityScorer

class RuntimeResilienceEngine(ResilienceProvider):
    """Main resilience evaluator auditing system containment, recovery quality, and overall survivability."""

    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Calculates dynamic system resilience vectors.
        
        Args:
            data (Dict[str, Any]): Resilience metrics payload containing:
                - containment_quality (float): Containment success coefficient.
                - recovery_actions (List[Dict[str, Any]]): Logged recovery step lists.
                - degradation_duration_seconds (float): Paced degradation timing.
                - exceptions (List[Dict[str, Any]]): Tracked incident list.
                - orchestration_score (float): Baseline orchestration score.
                - transport_score (float): Baseline transport score.
        """
        containment = data.get("containment_quality", 0.95)
        recovery_actions = data.get("recovery_actions", [])
        degradation_duration = data.get("degradation_duration_seconds", 0.0)
        exceptions = data.get("exceptions", [])
        orch_score = data.get("orchestration_score", 0.96)
        trans_score = data.get("transport_score", 0.98)

        # 1. Run sub-calculators
        stability_info = DegradationStabilityScorer.calculate_stability(degradation_duration)
        incident_info = InstabilityIncidentTracker.audit_incidents(exceptions)
        quality_info = RecoveryQualityScorer.audit_quality(recovery_actions)

        # 2. Package into ResilienceVector Pydantic output
        w = RESILIENCE_WEIGHTS
        weighted_sum = (
            (containment * w["containment"]) +
            (quality_info["recovery_quality"] * w["recovery"]) +
            (stability_info["degradation_stability"] * w["degradation"]) +
            (orch_score * w["orchestration"]) +
            (trans_score * w["transport"])
        )
        overall_survivability = round(weighted_sum, 3)

        vector = ResilienceVector(
            containment_quality=round(containment, 2),
            recovery_quality=quality_info["recovery_quality"],
            degradation_stability=stability_info["degradation_stability"],
            orchestration_resilience=round(orch_score, 2),
            transport_resilience=round(trans_score, 2),
            overall_survivability=overall_survivability
        )

        return vector.model_dump()
