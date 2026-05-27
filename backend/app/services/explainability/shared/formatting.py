from typing import List

class ExplanationFormatter:
    """Helper formatting functions for diagnostics output."""

    @staticmethod
    def format_percentage(val: float) -> str:
        """Converts float coefficients to percentages (e.g. 0.85 -> +85%)."""
        sign = "+" if val >= 0 else ""
        return f"{sign}{round(val * 100, 1)}%"

    @staticmethod
    def join_chains(chains: List[str]) -> str:
        """Flattens list sequences into diagnostic paragraphs."""
        return " -> ".join(chains)
