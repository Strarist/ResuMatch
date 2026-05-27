from typing import Dict, Any

class DegradationTuner:
    @staticmethod
    def tune_degradation(load_stability: float) -> Dict[str, Any]:
        """
        Tunes degradation boundaries (memory limits and latency parameters) under predictable workloads.
        """
        # Tune degradation latency limits
        latency_limit = 250.0
        memory_limit = 400.0
        
        if load_stability > 0.8:
            latency_limit = 300.0  # Allow larger loops spike margins under high overall stability
            memory_limit = 450.0
            
        return {
            "load_stability": load_stability,
            "latency_limit_ms": latency_limit,
            "memory_limit_mb": memory_limit
        }
