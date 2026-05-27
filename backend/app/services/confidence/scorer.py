"""Intelligence Confidence System."""

def calculate_confidence(data_points_count: int, source_reliability: float) -> str:
    """Score the confidence of an intelligence inference."""
    score = data_points_count * source_reliability
    if score > 8.0:
        return "high"
    elif score > 4.0:
        return "medium"
    return "low"
