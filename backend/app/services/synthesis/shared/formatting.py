class SynthesisFormatter:
    """Helper functions to format values and text in strategic briefs."""

    @staticmethod
    def format_delta(current: float, baseline: float) -> str:
        """Computes a percentage delta and returns a signed string (e.g. +14.2% or -5.1%)."""
        if baseline == 0:
            return "+0.0%"
        diff = ((current - baseline) / baseline) * 100.0
        sign = "+" if diff >= 0 else ""
        return f"{sign}{round(diff, 1)}%"

    @staticmethod
    def collapse_list(items: list[str]) -> str:
        """Converts a list of items into a clean comma-separated or dashed list."""
        if not items:
            return "none"
        if len(items) == 1:
            return items[0]
        return ", ".join(items[:-1]) + f", and {items[-1]}"
