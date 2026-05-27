from typing import Protocol, Dict, Any

class DiagnosticsProvider(Protocol):
    """Protocol for observability engines that monitor runtime components."""
    
    def diagnose(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Runs self-diagnostic checks and returns structural health metrics."""
        ...
