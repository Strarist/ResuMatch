class ResilienceFormatter:
    """Helper functions to format values and text in system recovery diagnostics."""

    @staticmethod
    def format_pct(value: float) -> str:
        """Converts a float coefficient (0.0 - 1.0) into a clean percentage string."""
        return f"{round(value * 100.0, 1)}%"

    @staticmethod
    def construct_mitigation_tag(subsystem: str, action: str) -> str:
        """Generates standard resilience logs (e.g., [CONTAINMENT::ISOLATED::PREDICTION_ENGINE])."""
        return f"[CONTAINMENT::{action.upper()}::{subsystem.upper()}]"
