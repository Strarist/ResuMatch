from typing import Dict, Any
from app.services.convergence.shared.optimization_rules import MIN_QUEUE_DEPTH

class QueueOptimizer:
    @staticmethod
    def optimize_queue(current_depth: int) -> Dict[str, Any]:
        """
        Compacts the queue size based on capacity optimization thresholds.
        
        Args:
            current_depth (int): Current depth limit of propagation queues.
        """
        # Compact queue size towards safety limits
        optimized = max(MIN_QUEUE_DEPTH, int(current_depth * 0.5))
        
        return {
            "depth_before": current_depth,
            "depth_after": optimized,
            "compression_ratio": round(optimized / current_depth, 2) if current_depth > 0 else 1.0,
            "action_taken": f"Compacted telemetry event queue depth from {current_depth} down to {optimized} safely."
        }
