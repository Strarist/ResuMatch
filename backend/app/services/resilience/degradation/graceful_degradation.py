from typing import Dict, Any
from app.services.resilience.shared.resilience_protocols import ResilienceProvider
from app.services.resilience.shared.resilience_models import DegradationState
from app.services.resilience.degradation.degradation_profiles import DegradationProfilesManager
from app.services.resilience.degradation.feature_suspension import FeatureSuspensionManager

class GracefulDegradationEngine(ResilienceProvider):
    """Orchestrates dynamic degradation profiles, fallback brokers, and feature suspensions under runtime stress."""

    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs graceful degradation audits.
        
        Args:
            data (Dict[str, Any]): Stress metrics payload containing:
                - latency_ms (float): Orchestration loop delay.
                - memory_usage_mb (float): Memory size occupied.
                - memory_limit_mb (float): Allocation safe limit.
        """
        latency_ms = data.get("latency_ms", 120.0)
        usage_mb = data.get("memory_usage_mb", 180.0)
        limit_mb = data.get("memory_limit_mb", 512.0)

        # 1. Compute stress ratio based on memory and latency
        mem_ratio = usage_mb / limit_mb
        lat_ratio = min(1.0, latency_ms / 300.0)
        stress_ratio = round(max(mem_ratio, lat_ratio), 2)

        # 2. Run sub-checks
        profile = DegradationProfilesManager.resolve_profile(stress_ratio)
        suspended = FeatureSuspensionManager.audit_features(usage_mb, limit_mb)

        state = DegradationState(
            active_profile=profile["profile_name"],
            expensive_telemetry_disabled=profile["expensive_telemetry_disabled"],
            synthesis_density=profile["synthesis_density"],
            prediction_pacing_seconds=profile["prediction_pacing_seconds"],
            transport_broadcast_rate=profile["transport_broadcast_rate"]
        )

        result = state.model_dump()
        result["suspended_features"] = suspended
        result["system_stress_ratio"] = stress_ratio
        return result
