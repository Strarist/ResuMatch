from typing import Dict, Any, List

class ProjectionTrace:
    """Tracks and explains simulated forecast timelines from the prediction engine."""

    @classmethod
    def get_projection_trace(cls, projections_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Processes raw projection datasets to generate a timeline explanation with milestone analysis."""

        weeks = projections_data.get("weeks", 12)
        projected_velocity = projections_data.get("projected_velocity", [])
        leverage_curve = projections_data.get("leverage_curve", [])
        visibility_decay = projections_data.get("visibility_decay", [])

        # Construct week-by-week timeline checkpoints
        timeline_checkpoints = []

        # We will split the timeline into 3 major milestone phases
        # Phase 1: Weeks 1-4 (Skill Incubation & Velocity Drift Stabilization)
        # Phase 2: Weeks 5-8 (Leverage Compounding & Recruitment Channel Warmup)
        # Phase 3: Weeks 9-12 (Optimal Target Achievement & Stagnation Risk Mitigation)

        for w in range(1, weeks + 1):
            idx = w - 1

            # Extract metrics for the current week if available, else fallbacks
            velocity = projected_velocity[idx] if idx < len(projected_velocity) else 75.0

            leverage_point = leverage_curve[idx] if idx < len(leverage_curve) else {}
            leverage = leverage_point.get("leverage", 80.0)
            leverage_gain = leverage_point.get("leverage_gain", "+0.0%")

            visibility = visibility_decay[idx] if idx < len(visibility_decay) else 70.0

            # Determine phase & milestone status description
            if w <= 4:
                phase_name = "Skill Incubation"
                milestone_desc = "Stabilizing early momentum. Building core pipeline foundation."
            elif w <= 8:
                phase_name = "Leverage Compounding"
                milestone_desc = "Active integration of new tools. Accelerated recruiter attraction kicks in."
            else:
                phase_name = "Strategic Convergence"
                milestone_desc = "Optimal opportunity alignment. Target profiles reach maximum velocity."

            timeline_checkpoints.append({
                "week": w,
                "phase": phase_name,
                "milestone": milestone_desc,
                "projected_velocity": velocity,
                "projected_leverage": leverage,
                "leverage_gain": leverage_gain,
                "visibility_decay": visibility
            })

        return timeline_checkpoints
