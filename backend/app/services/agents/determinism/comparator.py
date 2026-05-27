class StateComparator:
    """Compares actual vs expected state across orchestration boundaries."""

    def compare(self, expected: dict, actual: dict) -> bool:
        """Deep comparison of state structures."""
        import json
        return json.dumps(expected, sort_keys=True) == json.dumps(actual, sort_keys=True)
