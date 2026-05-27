from typing import Dict, Any, List

class LeverageReasoning:
    """Provides mathematical and strategic explainability for compound priority and leverage scores."""

    @classmethod
    def explain_leverage(
        cls,
        node_title: str,
        difficulty: str,
        estimated_weeks: int,
        urgency_factor: float
    ) -> Dict[str, Any]:
        """Explains the mathematical derivation of compound scores step-by-step."""

        # 1. Base Leverage: 15.0 / estimated_weeks
        base_leverage = round(15.0 / max(1.0, float(estimated_weeks)), 2)

        # 2. Difficulty divider: High -> 3.0, Medium -> 2.0, Low -> 1.2
        diff_weight = 3.0 if difficulty == "High" else (2.0 if difficulty == "Medium" else 1.2)

        # 3. Urgency factor
        mapped_urgency = max(1.0, urgency_factor)

        # 4. Compound Priority Score calculation
        compound_score = round((base_leverage / diff_weight) * mapped_urgency, 2)

        # 5. Career Velocity delta
        velocity_delta = round(compound_score * 1.5, 1)

        # Classify leverage potential
        if compound_score > 6.0:
            leverage_class = "CRITICAL_LEVERAGE"
        elif compound_score > 3.0:
            leverage_class = "HIGH_LEVERAGE"
        elif compound_score > 1.5:
            leverage_class = "MEDIUM_LEVERAGE"
        else:
            leverage_class = "LOW_LEVERAGE"

        # Math steps
        calculation_steps = [
            f"Step 1 (Base Leverage): 15.0 / {estimated_weeks} weeks = {base_leverage} baseline score.",
            f"Step 2 (Difficulty Scaling): Divided by {diff_weight} for '{difficulty}' effort level ({round(base_leverage / diff_weight, 2)} normalized).",
            f"Step 3 (Urgency Multiplier): Multiplied by {mapped_urgency} opportunity multiplier.",
            f"Step 4 (Final Priority Score): Resulting compound priority score is {compound_score}.",
            f"Step 5 (Trajectory Impact): Projected velocity impact coefficient: +{velocity_delta}%."
        ]

        return {
            "node_title": node_title,
            "compound_priority_score": compound_score,
            "base_leverage": base_leverage,
            "difficulty_divider": diff_weight,
            "urgency_multiplier": mapped_urgency,
            "projected_career_velocity_delta": f"+{velocity_delta}%",
            "leverage_class": leverage_class,
            "calculation_steps": calculation_steps,
            "summary": (
                f"Node '{node_title}' has a compound score of {compound_score} ({leverage_class.replace('_', ' ')}). "
                f"Short-duration milestones ({estimated_weeks} weeks) and high opportunity urgency "
                f"({mapped_urgency}x) maximize its optimization ranking."
            )
        }
