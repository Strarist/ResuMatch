from typing import Tuple, Optional
from app.services.agents.orchestrator.guards.depth_guard import DepthGuard
from app.services.agents.orchestrator.guards.duplicate_guard import DuplicateGuard
from app.services.agents.orchestrator.guards.temporal_guard import TemporalGuard
from app.services.agents.orchestrator.guards.causal_loop_guard import CausalLoopGuard

class PropagationValidator:
    """Master validator that enforces all propagation guard rules."""

    def __init__(self):
        self.depth_guard = DepthGuard()
        self.duplicate_guard = DuplicateGuard()
        self.temporal_guard = TemporalGuard()
        self.causal_loop_guard = CausalLoopGuard()

    def validate_event(self, event: dict) -> Tuple[bool, Optional[str]]:
        """
        Runs all guards against the orchestration event.

        Args:
            event (dict): The orchestration event.

        Returns:
            Tuple[bool, Optional[str]]: (is_valid, rejection_reason)
        """
        if not self.temporal_guard.validate(event):
            return False, "TEMPORAL_STALE"

        if not self.depth_guard.validate(event):
            return False, "DEPTH_EXCEEDED"

        if not self.causal_loop_guard.validate(event):
            return False, "CAUSAL_LOOP"

        if not self.duplicate_guard.validate(event):
            return False, "DUPLICATE_EVENT"

        return True, None
