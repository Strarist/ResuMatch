from typing import Dict, Any

class FailureBoundaryMonitor:
    """Monitors exception rates at subsystem entry points to trigger isolation loops."""

    @staticmethod
    def audit_boundary(exceptions_count: int, threshold: int = 5) -> Dict[str, Any]:
        """
        Evaluates boundary health and flags breaches.
        
        Args:
            exceptions_count (int): Count of raised exceptions in preceding window.
            threshold (int): Maximum safe threshold.
        """
        breached = exceptions_count >= threshold
        integrity = max(0.0, round(1.0 - (exceptions_count / (threshold * 2.0)), 2))

        return {
            "exceptions_count": exceptions_count,
            "threshold": threshold,
            "boundary_breached": breached,
            "integrity_coefficient": max(0.1, integrity)
        }
