from typing import Dict, Any, List
from app.services.resilience.shared.resilience_protocols import ResilienceProvider
from app.services.resilience.shared.resilience_models import FailureContainmentState
from app.services.resilience.containment.failure_boundaries import FailureBoundaryMonitor
from app.services.resilience.containment.propagation_throttling import PropagationThrottler
from app.services.resilience.containment.cascade_prevention import CascadeFailurePreventer

class FailureContainmentEngine(ResilienceProvider):
    """Orchestrates subsystem entry points checks, queue throttling, and locks breaking into FailureContainmentState."""

    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs failure containment and isolates unstable subsystems.
        
        Args:
            data (Dict[str, Any]): System containment metrics payload containing:
                - exceptions_count (int): Boundary exception incidents count.
                - queue_depth (int): Message queue storage depths.
                - active_locks (List[Dict[str, Any]]): Process thread locks.
                - isolated_subsystems (List[str]): Pre-existing isolated modules.
        """
        exceptions = data.get("exceptions_count", 0)
        queue_depth = data.get("queue_depth", 10)
        locks = data.get("active_locks", [])
        isolated = data.get("isolated_subsystems", [])

        # 1. Run sub-checks
        boundary_info = FailureBoundaryMonitor.audit_boundary(exceptions)
        throttle_info = PropagationThrottler.calculate_throttle(queue_depth)
        cascade_info = CascadeFailurePreventer.audit_cascades(locks)

        # 2. Package into FailureContainmentState Pydantic output
        new_isolated = list(isolated)
        lockdowns = []
        degraded = []

        if boundary_info["boundary_breached"]:
            new_isolated.append("Prediction Engine")
            degraded.append("Simulation Projections")
        
        if throttle_info["should_throttle"]:
            lockdowns.append("Trajectory Propagation Queue")
            degraded.append("Dynamic Telemetry Refresh")

        if cascade_info["broken_locks_count"] > 0:
            new_isolated.append("Stream Transport Broker")
            degraded.append("SSE Stream Broadcasting")

        # Compile overall runtime risk
        risk = round(
            ((1.0 - boundary_info["integrity_coefficient"]) * 0.4) +
            (throttle_info["fill_ratio"] * 0.3) +
            (cascade_info["cascade_risk_score"] * 0.3),
            2
        )

        overall_priority = "LOW"
        if risk >= 0.7:
            overall_priority = "CRITICAL"
        elif risk >= 0.5:
            overall_priority = "HIGH"
        elif risk >= 0.3:
            overall_priority = "MEDIUM"

        state = FailureContainmentState(
            isolated_subsystems=sorted(list(set(new_isolated))),
            propagation_lockdowns=lockdowns,
            degraded_services=degraded,
            recovery_priority=overall_priority,
            containment_reason="Boundary breached or circular locks detected." if risk > 0.3 else "System is fully stable.",
            runtime_risk_score=risk
        )

        return state.model_dump()
