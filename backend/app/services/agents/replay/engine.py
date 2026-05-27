from app.services.agents.replay.reconstruction import StateReconstructor
from app.services.agents.replay.validation import ReplayValidator
from app.services.agents.replay.drift import DriftAnalyzer

class ReplayEngine:
    """Master engine for orchestrating replay runs."""

    def __init__(self):
        self.reconstructor = StateReconstructor()
        self.validator = ReplayValidator()
        self.drift_analyzer = DriftAnalyzer()

    def replay_cycle(self, base_state: dict, events: list, expected_state: dict) -> dict:
        """
        Replays a full orchestration cycle and returns the validation result.

        Args:
            base_state (dict): The initial state checkpoint.
            events (list): The list of events to replay chronologically.
            expected_state (dict): The benchmark state to validate against.

        Returns:
            dict: The result containing determinism boolean and drift mapping.
        """
        actual_state = self.reconstructor.reconstruct(base_state, events)
        is_deterministic = self.validator.validate_states(expected_state, actual_state)

        result = {
            "is_deterministic": is_deterministic,
            "variance_score": 0.0 if is_deterministic else 1.0,
            "drift_sources": {}
        }

        if not is_deterministic:
            result["drift_sources"] = self.drift_analyzer.compute_drift(expected_state, actual_state)

        return result
