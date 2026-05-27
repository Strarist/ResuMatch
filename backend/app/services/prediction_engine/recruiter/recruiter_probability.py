from typing import Dict, Any

class RecruiterProbabilityModel:
    """Simulates recruiter response and outreach success probabilities."""

    @staticmethod
    def calculate_probability(metrics: dict, outreach_frequency: float) -> Dict[str, Any]:
        recruiter_conf = metrics.get("recruiterConfidence", 87.0)

        # Base probability derived from metrics
        base_prob = (recruiter_conf / 100.0) * 0.4

        # Outreach consistency contribution
        outreach_boost = outreach_frequency * 0.45

        prob = min(0.98, max(0.1, base_prob + outreach_boost))

        return {
            "success_probability": round(prob, 2),
            "expected_responses_per_10_contacts": round(prob * 10, 1),
            "rejection_risk": round(1.0 - prob, 2)
        }
