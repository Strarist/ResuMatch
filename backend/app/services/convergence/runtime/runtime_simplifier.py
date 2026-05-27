from typing import Dict, Any
from app.services.convergence.shared.calibration_protocols import ConvergenceProvider
from app.services.convergence.shared.convergence_models import PruningRecommendation
from app.services.convergence.runtime.orchestration_cleanup import OrchestrationCleanup
from app.services.convergence.runtime.abstraction_pruner import AbstractionPruner
from app.services.convergence.runtime.state_surface_optimizer import StateSurfaceOptimizer

class ArchitecturePruningEngine(ConvergenceProvider):
    """Orchestrates dead async task cleanups, redundant interface prunings, and storage state surface optimizations."""
    
    def mitigate(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """
        Runs architectural abstraction pruning.
        """
        # 1. Run sub-audits
        task_info = OrchestrationCleanup.audit_cleanup()
        abs_info = AbstractionPruner.audit_abstractions()
        state_info = StateSurfaceOptimizer.audit_states()
        
        # Combine safety score
        safety = round(task_info["prune_safety"] * 0.95, 2)
        
        state = PruningRecommendation(
            dead_abstractions=abs_info["dead_abstractions"] + task_info["prunable_tasks"],
            overlapping_services=abs_info["overlapping_services"],
            obsolete_helpers=abs_info["obsolete_helpers"],
            estimated_loc_saved=abs_info["estimated_loc_saved"] + (state_info["nested_attributes_collapsed"] * 10),
            pruning_safety_score=safety
        )
        
        return state.model_dump()
