from typing import List, Dict, Any

class OrchestrationDistiller:
    """Distills roadmap optimization traces into actionable prioritization signals."""

    @staticmethod
    def distill_priority_shifts(optimization_trace: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Scans optimization traces to detect nodes that shifted up or were newly introduced."""
        shifted_up = []
        new_nodes = []
        
        for trace in optimization_trace:
            shift = trace.get("position_shift", "STABLE")
            title = trace.get("node_title", "")
            
            if shift == "UP":
                shifted_up.append(title)
            elif shift == "NEW":
                new_nodes.append(title)
                
        return {
            "key_promotions": shifted_up[:2],
            "new_milestones": new_nodes[:2],
            "total_mutations": len(shifted_up) + len(new_nodes)
        }
