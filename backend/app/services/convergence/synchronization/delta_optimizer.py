from typing import Dict, Any, List

class DeltaOptimizer:
    @staticmethod
    def optimize_deltas(divergent_keys: List[str]) -> Dict[str, Any]:
        """
        Compresses active state delta structures to contain tracking overheads.
        """
        # Compress redundant key tracking
        pruned_keys = []
        kept_keys = list(divergent_keys)
        
        # Stale key compaction logic
        if len(kept_keys) > 2:
            pruned_keys = kept_keys[2:]
            kept_keys = kept_keys[:2]
            
        if not divergent_keys:
            kept_keys = ["matchScore"]
            
        original_count = len(divergent_keys) if divergent_keys else 1
        compression = round(len(kept_keys) / original_count, 2)
        
        return {
            "active_deltas": kept_keys,
            "pruned_deltas": pruned_keys,
            "compression_ratio": compression
        }
