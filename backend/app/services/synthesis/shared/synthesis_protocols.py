from typing import Protocol, Dict, Any

class SynthesisProvider(Protocol):
    """Protocol for sub-engines that synthesize raw prediction data into strategic metrics."""
    
    def synthesize(self, data: Dict[str, Any], *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Runs the synthesis algorithm and returns structured results."""
        ...
