from typing import Protocol, Dict, Any

class ExplanationProvider(Protocol):
    """Protocol for components that generate explainability data models."""

    def generate_explanation(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Generates a structured explanation payload."""
        ...
