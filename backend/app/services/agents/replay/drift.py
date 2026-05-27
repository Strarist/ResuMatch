class DriftAnalyzer:
    """Analyzes differences between states to identify the source of drift."""

    def compute_drift(self, expected_state: dict, actual_state: dict) -> dict:
        """
        Computes the delta between the expected state and actual state.

        Args:
            expected_state (dict): The deterministic benchmark state.
            actual_state (dict): The result of the replay cycle.

        Returns:
            dict: The key-value pairs that diverged.
        """
        drift = {}
        all_keys = set(expected_state.keys()).union(set(actual_state.keys()))
        for k in all_keys:
            if expected_state.get(k) != actual_state.get(k):
                drift[k] = {
                    "expected": expected_state.get(k),
                    "actual": actual_state.get(k)
                }
        return drift
