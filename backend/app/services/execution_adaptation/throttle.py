"""Execution Adaptation Engine."""

def adapt_execution_difficulty(recent_velocity: float, target_velocity: float) -> dict:
    """Dynamically scales roadmap difficulty based on execution consistency."""

    if recent_velocity > target_velocity + 15:
        return {
            "action": "intensify",
            "message": "You are crushing expectations. Increasing roadmap complexity.",
            "effort_multiplier": 1.2
        }
    elif recent_velocity < target_velocity - 15:
        return {
            "action": "simplify",
            "message": "Momentum is dropping. Simplifying immediate targets to regain consistency.",
            "effort_multiplier": 0.8
        }
    else:
        return {
            "action": "maintain",
            "message": "Execution is stable. Maintain current intensity.",
            "effort_multiplier": 1.0
        }
