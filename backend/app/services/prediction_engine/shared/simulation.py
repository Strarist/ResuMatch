from typing import Dict, Any

class PredictiveSandbox:
    """Helper class to replicate state dictionaries for isolated simulation testing."""

    @staticmethod
    def replicate_state(state: Dict[str, Any]) -> Dict[str, Any]:
        """Performs a deep clone of the state dict to ensure modifications don't leak."""
        import copy
        return copy.deepcopy(state)
