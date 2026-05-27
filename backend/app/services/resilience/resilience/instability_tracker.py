from typing import List, Dict, Any

class InstabilityIncidentTracker:
    """Tracks exception incidents and evaluates active subsystem exception levels."""

    @staticmethod
    def audit_incidents(exceptions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Traces exception frequency and targets failing components.
        
        Args:
            exceptions (List[Dict[str, Any]]): Logged boundary exception events.
        """
        if not exceptions:
            return {
                "instability_rate": 0.0,
                "incident_count": 0,
                "is_stable": True
            }

        # Target failing sub-systems
        failing_targets = {e.get("component") for e in exceptions if e.get("component")}
        
        rate = round(min(1.0, len(exceptions) * 0.1), 2)
        is_stable = rate < 0.3

        return {
            "instability_rate": rate,
            "incident_count": len(exceptions),
            "is_stable": is_stable,
            "failing_targets": sorted(list(failing_targets))
        }
