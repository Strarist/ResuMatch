from typing import Dict, Any, List

class ConfidenceExplainer:
    """Explains why confidence scores changed and surfaces uncertainty parameters."""

    @classmethod
    def explain_confidence(
        cls,
        confidence_vector: Dict[str, float]
    ) -> Dict[str, Any]:
        """Provides human-readable reasons for confidence strengths and uncertainties."""

        reasons_for_strength = []
        reasons_for_uncertainty = []

        # 1. Evaluate Data Density (Historical volume)
        density = confidence_vector.get("data_density_score", 0.5)
        if density > 0.7:
            reasons_for_strength.append("High volume of historical simulation snapshots calibrates baseline accuracy.")
        else:
            reasons_for_uncertainty.append("Limited historical simulation points (insufficient data density).")

        # 2. Evaluate Market Signal Strength
        market = confidence_vector.get("market_signal_strength", 0.5)
        if market > 0.8:
            reasons_for_strength.append("Strong market fit matches high-relevance domain technology indicators.")
        else:
            reasons_for_uncertainty.append("Weak technology alignment to hot core market stacks.")

        # 3. Evaluate Recruiter Signal Strength
        recruiter = confidence_vector.get("recruiter_signal_strength", 0.5)
        if recruiter > 0.7:
            reasons_for_strength.append("Consistency in candidate outreach drives strong recruiter trust metrics.")
        else:
            reasons_for_uncertainty.append("Low outreach frequency constraints recruiter response feedback loops.")

        # 4. Evaluate Reliability
        reliability = confidence_vector.get("execution_reliability_score", 0.5)
        if reliability > 0.8:
            reasons_for_strength.append("High career velocity consistency matches targeted project shipment rates.")
        else:
            reasons_for_uncertainty.append("Inconsistent execution schedules increase trajectory drift risk.")

        # Summary
        overall = confidence_vector.get("calibrated_confidence", 0.7)
        summary = (
            f"Overall confidence is {int(overall * 100)}%. "
            f"Key strength: {reasons_for_strength[0] if reasons_for_strength else 'baseline metrics'}. "
            f"Primary risk: {reasons_for_uncertainty[0] if reasons_for_uncertainty else 'none'}."
        )

        return {
            "summary": summary,
            "strengths": reasons_for_strength,
            "uncertainty_factors": reasons_for_uncertainty,
            "uncertainty_level": "HIGH" if overall < 0.6 else ("MEDIUM" if overall < 0.85 else "LOW")
        }
