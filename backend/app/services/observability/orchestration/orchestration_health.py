from typing import Dict, Any
from app.services.observability.shared.diagnostics_protocols import DiagnosticsProvider
from app.services.observability.shared.observability_models import OrchestrationHealth
from app.services.observability.orchestration.cycle_diagnostics import CycleDiagnosticsMonitor
from app.services.observability.orchestration.propagation_integrity import PropagationIntegrityChecker
from app.services.observability.orchestration.topology_health import TopologyHealthAuditor

class OrchestrationHealthEngine(DiagnosticsProvider):
    """Orchestrates loop stability, propagation integrity, and topology checks into an OrchestrationHealth briefing."""

    def diagnose(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs full orchestration health diagnosis.
        
        Args:
            data (Dict[str, Any]): System diagnostics payload containing:
                - latency_ms (float): Cycle delay.
                - propagation_events (List[Dict[str, Any]]): Causal trace details.
                - nodes (List[Dict[str, Any]]): Topology nodes list.
                - dependencies (List[Dict[str, Any]]): Topology edges.
                - degraded_cycles (int): Degradation occurrences.
                - replay_alignment (float): Replay alignment index.
        """
        latency_ms = data.get("latency_ms", 120.0)
        propagation_events = data.get("propagation_events", [])
        nodes = data.get("nodes", [])
        dependencies = data.get("dependencies", [])
        degraded_cycles = data.get("degraded_cycles", 0)
        replay_alignment = data.get("replay_alignment", 0.95)

        # 1. Run sub-audits
        cycle_info = CycleDiagnosticsMonitor.audit_cycle(latency_ms)
        propagation_info = PropagationIntegrityChecker.audit_propagation(propagation_events)
        topology_info = TopologyHealthAuditor.audit_topology(nodes, dependencies)

        # 2. Compile overall stability
        stability_score = round(
            (cycle_info["coherence_coefficient"] * 0.4) +
            (propagation_info["propagation_integrity"] * 0.4) +
            (topology_info["topology_coherence"] * 0.2),
            2
        )

        health = OrchestrationHealth(
            runtime_stability_score=stability_score,
            propagation_integrity_score=propagation_info["propagation_integrity"],
            topology_coherence_score=topology_info["topology_coherence"],
            orchestration_latency=latency_ms,
            degraded_cycle_count=degraded_cycles + (1 if cycle_info["is_degraded"] else 0),
            replay_alignment_score=replay_alignment
        )

        return health.model_dump()
