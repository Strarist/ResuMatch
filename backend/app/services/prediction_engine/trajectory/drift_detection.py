from typing import List, Dict, Any

class DriftDetectionEngine:
    """Monitors active state variables for trajectory stagnation, decay, or misalignment."""

    @staticmethod
    def analyze_drift(metrics: dict, consecutive_stagnant_days: int = 14) -> List[Dict[str, Any]]:
        drift_signals = []

        match_score = metrics.get("matchScore", 94.0)
        career_vel = metrics.get("careerVelocity", 78.0)
        market_fit = metrics.get("marketFit", 91.0)
        recruiter_conf = metrics.get("recruiterConfidence", 87.0)

        # 1. Stagnation Drift
        if consecutive_stagnant_days >= 14:
            drift_signals.append({
                "severity": "warning",
                "affected_system": "execution",
                "projected_long_term_impact": "-8% Career Velocity decay in 30 days due to inactivity",
                "mitigation_path": "Initiate new GitHub commits to restore execution momentum."
            })

        # 2. Market Divergence Drift
        if market_fit < 85.0:
            drift_signals.append({
                "severity": "critical",
                "affected_system": "market",
                "projected_long_term_impact": "-12% compensation bounds contraction over 6 months",
                "mitigation_path": "Incorporate trending backend skills (FastAPI, Redis) to halt divergence."
            })

        # 3. Recruiter Decay Drift
        if recruiter_conf < 80.0:
            drift_signals.append({
                "severity": "warning",
                "affected_system": "recruiter",
                "projected_long_term_impact": "-25% active search visibility rate in 60 days",
                "mitigation_path": "Increase outreach density to re-establish trust signals."
            })

        # If no drift found, add a low level drift
        if not drift_signals:
            drift_signals.append({
                "severity": "info",
                "affected_system": "market",
                "projected_long_term_impact": "Nominal tracking - No significant drift detected.",
                "mitigation_path": "Maintain current project shipment consistency."
            })

        return drift_signals
