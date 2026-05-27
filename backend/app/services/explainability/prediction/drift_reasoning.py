from typing import Dict, Any, List

class DriftReasoning:
    """Explains trajectory drift by mapping consistency drop rates, market shifts, and visibility decay."""

    @classmethod
    def explain_drift(
        cls,
        drift_signals: List[Dict[str, Any]],
        execution_consistency: float,
        outreach_frequency: float,
        market_fit: float
    ) -> Dict[str, Any]:
        """Provides a detailed diagnostic explanation of detected trajectory drift and mitigation vectors."""

        causal_factors = []
        mitigations = []
        overall_risk_factor = "LOW"
        risk_score = 0.0

        # Analyze execution drift
        if execution_consistency < 0.7:
            risk_score += 40.0 * (1.0 - execution_consistency)
            causal_factors.append({
                "factor_type": "EXECUTION_CONSISTENCY_DROP",
                "severity": "MEDIUM" if execution_consistency >= 0.5 else "HIGH",
                "description": f"Execution consistency is currently at {int(execution_consistency*100)}% (target: >= 80%).",
                "impact": "Reduces career velocity, delaying roadmap milestone completions."
            })
            mitigations.append("Commit project artifacts regularly to re-establish velocity momentum.")

        # Analyze market alignment drift
        if market_fit < 88.0:
            risk_score += 30.0 * (1.0 - market_fit / 100.0)
            causal_factors.append({
                "factor_type": "MARKET_ALIGNMENT_DECAY",
                "severity": "CRITICAL" if market_fit < 80.0 else "MEDIUM",
                "description": f"Market alignment score is at {market_fit}% (below the nominal 90% threshold).",
                "impact": "Decreases leverage in hot core-market stack alignment."
            })
            mitigations.append("Acquire and verify high-demand tech stacks (e.g. FastAPI, Docker, Kubernetes).")

        # Analyze visibility plateau drift
        if outreach_frequency < 0.6:
            risk_score += 30.0 * (1.0 - outreach_frequency)
            causal_factors.append({
                "factor_type": "RECRUITER_VISIBILITY_PLATEAU",
                "severity": "MEDIUM" if outreach_frequency >= 0.3 else "HIGH",
                "description": f"Outreach frequency is low at {int(outreach_frequency*100)}% contact density.",
                "impact": "Creates a communication vacuum, lowering recruiter engagement response rates."
            })
            mitigations.append("Raise daily/weekly outreach volume to warm up inbound pipelines.")

        # If no explicit drift factors triggered from raw values, examine drift_signals
        for sig in drift_signals:
            if sig.get("severity") in ["warning", "critical"]:
                if sig.get("severity") == "critical":
                    risk_score += 25
                else:
                    risk_score += 15

                # Deduplicate/append
                already_has_mitigation = any(m == sig.get("mitigation_path") for m in mitigations)
                if not already_has_mitigation:
                    mitigations.append(sig.get("mitigation_path"))

        # Normalize risk score
        risk_score = round(min(100.0, risk_score), 1)
        if risk_score > 60:
            overall_risk_factor = "HIGH"
        elif risk_score > 30:
            overall_risk_factor = "MEDIUM"
        else:
            overall_risk_factor = "LOW"
            if not causal_factors:
                causal_factors.append({
                    "factor_type": "NOMINAL_TRACKING",
                    "severity": "INFO",
                    "description": "Trajectory is operating within nominal drift thresholds.",
                    "impact": "None detected."
                })
                mitigations.append("Maintain current project shipment rates and communication consistency.")

        summary = (
            f"Trajectory drift risk is {overall_risk_factor} ({risk_score}/100). "
            f"A total of {len([cf for cf in causal_factors if cf['severity'] != 'INFO'])} drift triggers detected. "
            f"Recommended reconstruction path involves {len(mitigations)} targeted correction actions."
        )

        return {
            "summary": summary,
            "overall_risk_factor": overall_risk_factor,
            "risk_score": risk_score,
            "causal_factors": causal_factors,
            "reconstruction_path": mitigations
        }
