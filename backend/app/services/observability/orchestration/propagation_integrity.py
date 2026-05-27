from typing import Dict, Any, List

class PropagationIntegrityChecker:
    """Verifies that events propagate correctly through the causal influence chain."""

    @staticmethod
    def audit_propagation(propagation_events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Scans propagation logs to detect signal losses or path failures.
        
        Args:
            propagation_events (List[Dict[str, Any]]): Chronological event traces.
        """
        if not propagation_events:
            return {
                "propagation_integrity": 1.0,
                "failed_propagations": 0,
                "summary": "Signal propagation pathway fully synchronized and intact."
            }

        failed_count = sum(1 for e in propagation_events if e.get("status") == "FAILED")
        total_count = len(propagation_events)
        
        integrity = round(max(0.0, 1.0 - (failed_count / total_count)), 2)

        return {
            "propagation_integrity": integrity,
            "failed_propagations": failed_count,
            "summary": f"Audited {total_count} propagations. {failed_count} failures detected."
        }
