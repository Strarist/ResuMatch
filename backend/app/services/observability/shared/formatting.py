class ObservabilityFormatter:
    """Helper functions to format values and text in system runtime diagnostics."""

    @staticmethod
    def format_pct(value: float) -> str:
        """Converts a float coefficient (0.0 - 1.0) into a clean percentage string."""
        return f"{round(value * 100.0, 1)}%"

    @staticmethod
    def format_latency(ms: float) -> str:
        """Converts millisecond counts into human-readable latency tags."""
        if ms >= 1000.0:
            return f"{round(ms / 1000.0, 2)}s"
        return f"{round(ms, 1)}ms"

    @staticmethod
    def construct_system_tag(engine_name: str, level: str) -> str:
        """Generates standard diagnostic labels (e.g., [ORCHESTRATION::CRITICAL])."""
        return f"[{engine_name.upper()}::{level.upper()}]"
