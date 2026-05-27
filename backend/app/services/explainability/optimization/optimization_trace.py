from typing import Dict, Any, List

class OptimizationTrace:
    """Traces priority ordering changes and calculations performed by the Strategic Optimizer."""

    @classmethod
    def generate_optimization_trace(
        cls,
        raw_nodes: List[Dict[str, Any]],
        optimized_nodes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generates audit traces detailing why certain roadmap nodes moved up or down in the sequence."""

        traces = []

        # Build lookup maps for fast comparison
        raw_lookup = {node.get("node_title"): idx for idx, node in enumerate(raw_nodes)}

        for opt_idx, opt_node in enumerate(optimized_nodes):
            title = opt_node.get("node_title")
            raw_idx = raw_lookup.get(title)

            if raw_idx is None:
                # Node was added/not present in raw list
                shift = "NEW"
                shift_description = f"Node '{title}' was newly added to the optimized trajectory."
            else:
                diff = raw_idx - opt_idx
                if diff > 0:
                    shift = "UP"
                    shift_description = f"Node '{title}' shifted UP by {diff} positions in sequence."
                elif diff < 0:
                    shift = "DOWN"
                    shift_description = f"Node '{title}' shifted DOWN by {abs(diff)} positions in sequence."
                else:
                    shift = "STABLE"
                    shift_description = f"Node '{title}' maintained its priority position."

            priority_score = opt_node.get("compound_priority_score", 0.0)
            difficulty = opt_node.get("difficulty", "Medium")
            weeks = opt_node.get("estimated_weeks", 2)

            traces.append({
                "node_title": title,
                "raw_index": raw_idx,
                "optimized_index": opt_idx,
                "position_shift": shift,
                "shift_description": shift_description,
                "compound_priority_score": priority_score,
                "difficulty_level": difficulty,
                "duration_weeks": weeks,
                "reasoning_reason": (
                    f"Prioritized with score {priority_score} based on {weeks}-week duration "
                    f"and {difficulty.lower()} difficulty parameters."
                )
            })

        return traces
