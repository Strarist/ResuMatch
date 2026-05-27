from typing import Dict, Any
from app.services.observability.shared.observability_models import RuntimeTrustVector
from app.services.observability.shared.formatting import ObservabilityFormatter

class RuntimeTrustEngine:
    """Combines sub-system scores to formulate evidence-based system trust vectors."""

    @staticmethod
    def calculate_trust(
        orchestration_score: float,
        prediction_score: float,
        replay_score: float,
        sync_score: float,
        transport_score: float
    ) -> RuntimeTrustVector:
        """
        Calculates a deterministic overall runtime trust score.
        
        Weights:
            - Orchestration Stability: 25%
            - Prediction Integrity: 20%
            - Replay Determinism: 20%
            - Synchronization Coherence: 15%
            - Transport Stability: 20%
        """
        # Ensure all scores are bounded between 0.0 and 1.0
        o = max(0.0, min(1.0, orchestration_score))
        p = max(0.0, min(1.0, prediction_score))
        r = max(0.0, min(1.0, replay_score))
        s = max(0.0, min(1.0, sync_score))
        t = max(0.0, min(1.0, transport_score))

        weighted_sum = (o * 0.25) + (p * 0.20) + (r * 0.20) + (s * 0.15) + (t * 0.20)
        overall_trust = round(weighted_sum, 3)

        return RuntimeTrustVector(
            orchestration_trust=round(o, 2),
            prediction_trust=round(p, 2),
            replay_trust=round(r, 2),
            synchronization_trust=round(s, 2),
            transport_trust=round(t, 2),
            overall_runtime_trust=overall_trust
        )
