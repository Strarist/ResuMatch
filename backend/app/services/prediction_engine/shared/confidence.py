from typing import Dict, Any

class ConfidenceVector:
    """Calculates and encapsulates multiple confidence scores for predictions."""

    def __init__(
        self,
        prediction_confidence: float = 1.0,
        data_density_score: float = 1.0,
        market_signal_strength: float = 1.0,
        recruiter_signal_strength: float = 1.0,
        execution_reliability_score: float = 1.0
    ):
        self.prediction_confidence = max(0.0, min(1.0, prediction_confidence))
        self.data_density_score = max(0.0, min(1.0, data_density_score))
        self.market_signal_strength = max(0.0, min(1.0, market_signal_strength))
        self.recruiter_signal_strength = max(0.0, min(1.0, recruiter_signal_strength))
        self.execution_reliability_score = max(0.0, min(1.0, execution_reliability_score))

    def to_dict(self) -> Dict[str, float]:
        return {
            "prediction_confidence": round(self.prediction_confidence, 2),
            "data_density_score": round(self.data_density_score, 2),
            "market_signal_strength": round(self.market_signal_strength, 2),
            "recruiter_signal_strength": round(self.recruiter_signal_strength, 2),
            "execution_reliability_score": round(self.execution_reliability_score, 2)
        }

    @classmethod
    def evaluate_state(cls, metrics: dict, outreach_count: int, history_len: int) -> "ConfidenceVector":
        """Evaluates live data to compute a realistic confidence vector."""
        # More metrics and history -> higher density score
        density = min(1.0, (len(metrics) * 0.15) + (history_len * 0.1) + 0.3)

        # High market fit -> stronger market signal
        market_sig = min(1.0, (metrics.get("marketFit", 80.0) / 100.0))

        # Outreach count -> recruiter signal strength
        recruiter_sig = min(1.0, (outreach_count * 0.1) + 0.4)

        # Execution consistency -> reliability
        reliability = min(1.0, (metrics.get("careerVelocity", 75.0) / 100.0))

        # Overall average
        overall = (density + market_sig + recruiter_sig + reliability) / 4.0

        return cls(
            prediction_confidence=overall,
            data_density_score=density,
            market_signal_strength=market_sig,
            recruiter_signal_strength=recruiter_sig,
            execution_reliability_score=reliability
        )
