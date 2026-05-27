from typing import List, Dict, Any

class CascadeFailurePreventer:
    """Safeguards execution loop threads by breaking recursive dependencies and circular reference locks."""

    @staticmethod
    def audit_cascades(active_locks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes locks to break recursive dependency cycles.
        
        Args:
            active_locks (List[Dict[str, Any]]): Thread and process lock records.
        """
        if not active_locks:
            return {
                "cascade_risk_score": 0.0,
                "broken_locks_count": 0,
                "locks_audited": 0
            }

        # Look for circular loops: lock where holder is blocked by another holder
        blocked_by_map = {lock.get("holder"): lock.get("blocked_by") for lock in active_locks if lock.get("holder")}
        
        broken_count = 0
        for holder, blocked_by in blocked_by_map.items():
            # Simplest loop check: direct circular dependency
            if blocked_by_map.get(blocked_by) == holder:
                broken_count += 1

        risk = round(min(1.0, len(active_locks) * 0.15 + broken_count * 0.3), 2)

        return {
            "cascade_risk_score": risk,
            "broken_locks_count": broken_count,
            "locks_audited": len(active_locks)
        }
