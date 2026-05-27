"""Recruiter behavioral signals modeling."""

def model_recruiter_attention(portfolio_score: float, competitiveness: float) -> dict:
    """Models how recruiters react based on proof and market competitiveness."""

    # Calculate probabilities
    dwell_time_seconds = 10 + (portfolio_score * 45) # between 10s and 55s
    shortlist_probability = min(1.0, (portfolio_score * 0.6) + (competitiveness * 0.4))
    callback_probability = shortlist_probability * 0.5

    return {
        "dwell_time_seconds": round(dwell_time_seconds, 1),
        "shortlist_probability": round(shortlist_probability, 3),
        "callback_probability": round(callback_probability, 3)
    }
