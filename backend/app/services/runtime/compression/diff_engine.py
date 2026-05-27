class DiffEngine:
    """Computes the difference between two JSON-serializable dictionaries."""

    @staticmethod
    def compute_diff(old_state: dict, new_state: dict) -> dict:
        """Returns a dict containing only the keys that changed."""
        delta = {}
        for key, value in new_state.items():
            if key not in old_state or old_state[key] != value:
                delta[key] = value
        return delta
