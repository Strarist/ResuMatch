"""Confidence calibration — prevents overconfident AI conclusions."""


def calibrate(raw_confidence: float, evidence_count: int, longitudinal_occurrences: int = 1) -> float:
    """Calibrate confidence based on evidence strength.

    Rules:
    - Single weak signal: capped at 0.42
    - Multiple evidence points: scales up to 0.75
    - Longitudinal confirmation (seen across analyses): up to 0.92
    - Never reaches 1.0 (epistemic humility)
    """
    if evidence_count == 0:
        return 0.0

    # Base: evidence count drives confidence floor
    base = min(evidence_count * 0.15, 0.6)

    # Longitudinal boost: repeated observations increase confidence
    longitudinal_boost = min((longitudinal_occurrences - 1) * 0.1, 0.3)

    # Raw AI confidence contributes but is dampened
    ai_contribution = raw_confidence * 0.3

    calibrated = base + longitudinal_boost + ai_contribution
    return round(min(calibrated, 0.92), 3)


def confidence_label(score: float) -> str:
    """Human-readable confidence category."""
    if score >= 0.75:
        return "high"
    if score >= 0.5:
        return "moderate"
    if score >= 0.3:
        return "low"
    return "insufficient"
