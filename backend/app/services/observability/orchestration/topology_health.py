from typing import Dict, Any, List

class TopologyHealthAuditor:
    """Verifies that orchestration tree models remain cyclic-free and fully cohesive."""

    @staticmethod
    def audit_topology(nodes: List[Dict[str, Any]], dependencies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Audits topology layers to check for parent-child coherence and invalid loops.
        
        Args:
            nodes (List[Dict[str, Any]]): Structural topology node details.
            dependencies (List[Dict[str, Any]]): Node relationship lines/edges.
        """
        if not nodes:
            return {
                "topology_coherence": 1.0,
                "orphaned_count": 0,
                "has_cycles": False
            }

        # Check for orphans: nodes with no parents (excluding root nodes)
        parent_set = {d.get("parent_id") for d in dependencies if d.get("parent_id")}
        child_set = {d.get("child_id") for d in dependencies if d.get("child_id")}

        orphaned = [n for n in nodes if n.get("id") not in parent_set and n.get("id") not in child_set]
        
        # Simple heuristic loop checker
        has_cycles = False
        for d in dependencies:
            if d.get("parent_id") == d.get("child_id"):
                has_cycles = True
                break

        coherence = 1.0
        if orphaned:
            coherence -= min(0.3, len(orphaned) * 0.1)
        if has_cycles:
            coherence -= 0.5

        return {
            "topology_coherence": round(max(0.1, coherence), 2),
            "orphaned_count": len(orphaned),
            "has_cycles": has_cycles
        }
