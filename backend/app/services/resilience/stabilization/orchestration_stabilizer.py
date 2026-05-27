from typing import Dict, Any, List
from app.services.resilience.shared.resilience_protocols import ResilienceProvider
from app.services.resilience.stabilization.runtime_balancer import ConcurrencyBalancer
from app.services.resilience.stabilization.load_smoothing import TelemetryLoadSmoother
from app.services.resilience.stabilization.adaptive_throttling import AdaptiveThrottler

class OrchestrationStabilizer(ResilienceProvider):
    """Orchestrates Concurrency workload balancing, metric smoothing, and rate throttling into system stabilizers."""

    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Coordinates orchestration stabilization loops.
        
        Args:
            data (Dict[str, Any]): Stabilization parameters payload containing:
                - active_tasks (int): Concurrency tasks count.
                - query_latencies (List[float]): Database latency lists.
                - request_rate (float): Incoming triggers per second.
        """
        active_tasks = data.get("active_tasks", 25)
        latencies = data.get("query_latencies", [14.0, 18.0, 15.0])
        request_rate = data.get("request_rate", 5.0)

        # 1. Run sub-checks
        concurrency_info = ConcurrencyBalancer.audit_balance(active_tasks)
        smoothing_info = TelemetryLoadSmoother.smooth_latencies(latencies)
        throttle_info = AdaptiveThrottler.audit_throttle(request_rate)

        # 2. Package into consolidated stabilization recommendations
        needs_mitigation = (
            concurrency_info["needs_balancing"] or
            smoothing_info["is_spiky"] or
            throttle_info["should_throttle"]
        )

        pacing_delay = 0.0
        if throttle_info["should_throttle"]:
            pacing_delay = 2.0
        elif concurrency_info["needs_balancing"]:
            pacing_delay = 1.0

        return {
            "stabilization_applied": needs_mitigation,
            "smoothed_latency_ms": smoothing_info["smoothed_latency_ms"],
            "suggested_workers": concurrency_info["suggested_workers"],
            "throttle_pacing_delay": pacing_delay,
            "throttle_percentage": throttle_info["throttle_percentage"]
        }
