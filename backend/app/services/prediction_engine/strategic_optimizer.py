from typing import List, Dict, Any

class StrategicOptimizer:
    """Optimizes career leverage paths, skill sequencing, and opportunity timing via bounded loops."""

    @classmethod
    def optimize_execution_sequence(
        cls,
        skills: List[str],
        roadmap_nodes: List[Dict[str, Any]],
        opportunity_windows: List[Dict[str, Any]],
        max_depth: int = 4
    ) -> List[Dict[str, Any]]:
        """Determines the optimal sequence of actions to execute next, guarded by a recursion limit."""

        # Flatten skills
        lower_skills = {s.lower() for s in skills}

        # Resolve urgency coefficients from opportunity windows
        # Base urgency weight is derived from closing days
        urgency_map = {}
        for win in opportunity_windows:
            role = win.get("role_category", "")
            days = win.get("days_remaining", 30)
            status = win.get("status", "OPEN")

            # Shorter days remaining -> higher urgency multiplier
            multiplier = 2.0 if status == "CLOSING" else (1.5 if status == "OPEN" else 1.1)
            urgency_factor = max(1.0, 10.0 / max(1.0, float(days))) * multiplier
            urgency_map[role.lower()] = urgency_factor

        optimized_actions = []

        # Guarded processing loop (prevents recursive complexity explosion)
        # Recursion depth is tracked explicitly
        def compute_priorities_bounded(nodes: list, depth: int) -> None:
            if depth >= max_depth or not nodes:
                return

            scored_nodes = []
            for node in nodes:
                title = node.get("node_title", "")
                difficulty_str = node.get("difficulty", "Medium")
                weeks = node.get("estimated_weeks", 2)

                # Scale difficulty divider
                diff_weight = 3.0 if difficulty_str == "High" else (2.0 if difficulty_str == "Medium" else 1.2)
                # Base leverage score (arbitrary baseline adjusted by weeks)
                base_leverage = 15.0 / max(1.0, float(weeks))

                # Identify if this skill maps to an urgent opportunity role
                mapped_urgency = 1.0
                for role_category, urgency in urgency_map.items():
                    if any(kw in role_category or kw in title.lower() for kw in ["systems", "platform", "backend", "fastapi"]):
                        mapped_urgency = max(mapped_urgency, urgency)

                compound_score = round((base_leverage / diff_weight) * mapped_urgency, 2)
                scored_nodes.append({
                    "node_title": title,
                    "phase": node.get("phase", ""),
                    "difficulty": difficulty_str,
                    "estimated_weeks": weeks,
                    "compound_priority_score": compound_score,
                    "target_leverage_delta": f"+{round(compound_score * 1.5, 1)}% Career Velocity"
                })

            # Sort by compound priority score descending
            scored_nodes.sort(key=lambda x: x["compound_priority_score"], reverse=True)

            # Append sorted actions
            for action in scored_nodes:
                optimized_actions.append(action)

        compute_priorities_bounded(roadmap_nodes, 0)

        return optimized_actions
