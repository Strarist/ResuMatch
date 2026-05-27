from typing import Dict, Any, List

class InfluenceChain:
    """Models how various source signals propagate influence and weightings to final outcomes."""

    @classmethod
    def generate_chain(
        cls,
        skills: List[str],
        metrics: Dict[str, float],
        outreach_frequency: float,
        execution_consistency: float
    ) -> Dict[str, Any]:
        # 1. Map source signals and their raw strengths
        source_signals = {
            "skill_count_raw": len(skills),
            "outreach_target_coeff": outreach_frequency,
            "consistency_factor": execution_consistency,
            "current_market_fit": metrics.get("marketFit", 91.0)
        }

        # 2. Formulate weighting breakdown
        # Calculates how inputs are scaled in recommendations
        total_weight = 1.0
        weighting_breakdown = {
            "skills_importance": round(min(0.5, len(skills) * 0.08), 2),
            "outreach_importance": round(outreach_frequency * 0.35, 2),
            "execution_importance": round(execution_consistency * 0.35, 2)
        }

        # Normalize weights so they sum to 1.0 (or represent relative impact)
        sum_w = sum(weighting_breakdown.values())
        if sum_w > 0:
            weighting_breakdown = {k: round(v / sum_w, 2) for k, v in weighting_breakdown.items()}

        # 3. Calculate confidence impact (positive or negative drag)
        confidence_impact = 0.0
        if execution_consistency > 0.8:
            confidence_impact += 0.08
        else:
            confidence_impact -= 0.05

        if outreach_frequency > 0.6:
            confidence_impact += 0.06
        else:
            confidence_impact -= 0.04

        # 4. List affected predictions
        affected_predictions = [
            "recruiter_response_probability",
            "twelve_week_velocity_projection",
            "compensation_percentile_alignment"
        ]

        # 5. Formulate strategic reasoning summary
        skills_str = ", ".join(skills) if skills else "none"
        summary = (
            f"Execution consistency of {int(execution_consistency * 100)}% "
            f"combined with outreach rate of {int(outreach_frequency * 100)}% "
            f"anchors target specializations. Active skill targets ({skills_str}) "
            f"contributed {int(weighting_breakdown.get('skills_importance', 0) * 100)}% "
            f"to the current roadmap optimization iteration."
        )

        return {
            "source_signals": source_signals,
            "weighting_breakdown": weighting_breakdown,
            "confidence_impact": round(confidence_impact, 2),
            "affected_predictions": affected_predictions,
            "strategic_reasoning_summary": summary
        }
