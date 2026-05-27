class DriftAnalyzer:
    """Analyzes non-deterministic drift outputs."""

    def identify_sources(self, expected: dict, actual: dict) -> list:
        """Returns a list of fields that diverge between runs."""
        sources = []
        all_keys = set(expected.keys()).union(set(actual.keys()))
        for k in all_keys:
            if expected.get(k) != actual.get(k):
                sources.append(k)
        return sources
