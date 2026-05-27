from typing import Dict, Any, List

class StrategicPriorityTrace:
    """Traces and explains relative ranking scores and differentials between optimized roadmap targets."""

    @classmethod
    def trace_priorities(cls, optimized_nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Processes optimized roadmap nodes to calculate the differential gap between consecutive ranks."""

        traces = []

        for idx, node in enumerate(optimized_nodes):
            rank = idx + 1
            title = node.get("node_title")
            score = node.get("compound_priority_score", 0.0)

            # Calculate gap to the next node in rank (if there is one)
            next_score = 0.0
            if idx + 1 < len(optimized_nodes):
                next_score = optimized_nodes[idx + 1].get("compound_priority_score", 0.0)

            delta_gap = round(score - next_score, 2)

            if rank == 1:
                description = f"Primary critical path milestone. Score leads next rank by {delta_gap} points."
            elif delta_gap > 1.5:
                description = f"Strong prioritization separator (+{delta_gap} points). Highly isolated milestone layer."
            elif delta_gap > 0.0:
                description = f"Standard priority transition. Close margin (+{delta_gap} points) above next milestone."
            else:
                description = "Equal ranking score. Sequencing order determined by base phase dependencies."

            traces.append({
                "rank": rank,
                "node_title": title,
                "compound_priority_score": score,
                "delta_to_next": delta_gap,
                "ranking_description": description,
                "target_leverage_delta": node.get("target_leverage_delta", "+0.0% Career Velocity")
            })

        return traces
