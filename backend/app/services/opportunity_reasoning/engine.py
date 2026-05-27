"""Opportunity Reasoning Engine."""

def generate_opportunity_reasoning(role: str, user_state: dict) -> dict:
    """Generate transparent reasoning for why an opportunity was matched."""
    # Mock reasoning logic based on user_state
    reasons = [
        "Kubernetes maturity: High",
        "CI/CD credibility: Strong",
        "Recruiter demand trend: Rising"
    ]

    missing_unlocks = [
        "Improve architecture depth",
        "Increase deployment scale proof"
    ]

    return {
        "role": role,
        "reasons": reasons,
        "missing_unlocks": missing_unlocks
    }
