from typing import Dict, Any
from app.services.convergence.shared.calibration_protocols import ConvergenceProvider
from app.services.convergence.shared.convergence_models import OrchestrationConvergenceState
from app.services.convergence.orchestration.propagation_simplifier import PropagationSimplifier
from app.services.convergence.orchestration.queue_optimizer import QueueOptimizer
from app.services.convergence.orchestration.topology_compressor import TopologyCompressor

class OrchestrationConvergenceEngine(ConvergenceProvider):
    """Orchestrates propagation simplifications, event queue compacting, and topology compressions."""
    
    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs full orchestration Simplification.
        
        Args:
            data (Dict[str, Any]): Metrics parameters containing:
                - active_chains (List[str]): event channels list.
                - queue_depth (int): message queue size limits.
                - nodes_count (int): count of active topological modules.
                - topology_depth (int): max hierarchy loop depths.
        """
        active_chains = data.get("active_chains", [])
        queue_depth = data.get("queue_depth", 40)
        nodes_count = data.get("nodes_count", 15)
        top_depth = data.get("topology_depth", 8)
        
        # 1. Run sub-optimization checks
        prop_info = PropagationSimplifier.simplify_propagation(active_chains)
        queue_info = QueueOptimizer.optimize_queue(queue_depth)
        top_info = TopologyCompressor.compress_topology(nodes_count, top_depth)
        
        # Calculate dynamic simplification ratio
        simplification_pct = round(
            (prop_info["redundant_count"] * 0.4) +
            ((1.0 - queue_info["compression_ratio"]) * 0.3) +
            (top_info["depth_reduction_ratio"] * 0.3),
            2
        )
        
        state = OrchestrationConvergenceState(
            redundant_paths_identified=prop_info["redundant_chains_removed"],
            simplified_propagation_chains=prop_info["simplified_chains"],
            optimized_queue_depth=queue_info["depth_after"],
            topology_depth_before=top_info["depth_before"],
            topology_depth_after=top_info["depth_after"],
            simplification_percentage=simplification_pct
        )
        
        return state.model_dump()
