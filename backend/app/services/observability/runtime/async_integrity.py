from typing import Dict, Any, List

class AsyncTaskIntegrityAuditor:
    """Audits asynchronous task scheduling and tracks task cancellation rates."""

    @staticmethod
    def audit_tasks(scheduled_count: int, cancelled_count: int) -> Dict[str, Any]:
        """
        Computes cancellation ratios to indicate async runtime integrity.
        
        Args:
            scheduled_count (int): Active concurrency task allocations.
            cancelled_count (int): Aborted or terminated task counts.
        """
        if scheduled_count == 0:
            return {
                "cancellation_ratio": 0.0,
                "is_concurrency_stable": True
            }

        ratio = round(cancelled_count / scheduled_count, 3)
        
        # High cancellation ratio (>30%) suggests event loop congestion or unstable timeouts
        is_stable = ratio < 0.30

        return {
            "cancellation_ratio": ratio,
            "is_concurrency_stable": is_stable
        }
