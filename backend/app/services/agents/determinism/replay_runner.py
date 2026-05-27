from app.services.agents.replay.engine import ReplayEngine

class ReplayRunner:
    """Executes a cycle against the ReplayEngine for validation purposes."""

    def __init__(self):
        self.engine = ReplayEngine()

    def execute_test_run(self, base_state: dict, events: list, expected_state: dict) -> dict:
        """Runs the engine and returns the validation dict."""
        return self.engine.replay_cycle(base_state, events, expected_state)
