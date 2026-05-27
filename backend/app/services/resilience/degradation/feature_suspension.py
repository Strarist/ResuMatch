from typing import List, Dict, Any

class FeatureSuspensionManager:
    """Manages active suspension of non-essential features under high memory/CPU stress."""

    @staticmethod
    def audit_features(memory_mb: float, memory_limit: float = 512.0) -> List[str]:
        """
        Determines which processing modules should be disabled to prevent OOM.
        
        Args:
            memory_mb (float): Memory size occupied in megabytes.
            memory_limit (float): OOM boundary limit.
        """
        ratio = memory_mb / memory_limit
        suspended = []

        if ratio >= 0.90:
            suspended.append("Explainable Causal Graphing")
            suspended.append("Historical Replay Simulation")
            suspended.append("Advanced Opportunity Clustering")
        elif ratio >= 0.75:
            suspended.append("Explainable Causal Graphing")
            suspended.append("Historical Replay Simulation")
        elif ratio >= 0.60:
            suspended.append("Explainable Causal Graphing")

        return suspended
