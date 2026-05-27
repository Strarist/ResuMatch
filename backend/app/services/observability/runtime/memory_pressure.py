from typing import Dict, Any

class MemoryPressureMonitor:
    """Monitors system memory consumption levels and alerts on threshold limits."""

    @staticmethod
    def audit_memory(usage_mb: float, limit_mb: float = 512.0) -> Dict[str, Any]:
        """
        Benchmarks active memory usage and evaluates pressure indices.
        
        Args:
            usage_mb (float): Memory size occupied in megabytes.
            limit_mb (float): Maximum safe operational allocation threshold.
        """
        pressure_ratio = usage_mb / limit_mb
        is_overloaded = pressure_ratio >= 0.85

        if pressure_ratio >= 0.90:
            level = "CRITICAL"
        elif pressure_ratio >= 0.70:
            level = "HIGH"
        elif pressure_ratio >= 0.40:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "usage_mb": usage_mb,
            "limit_mb": limit_mb,
            "pressure_ratio": round(pressure_ratio, 3),
            "pressure_level": level,
            "is_overloaded": is_overloaded
        }
