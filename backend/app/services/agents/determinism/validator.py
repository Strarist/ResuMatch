from app.services.agents.determinism.comparator import StateComparator
from app.services.agents.determinism.drift_analysis import DriftAnalyzer
from app.services.agents.determinism.replay_runner import ReplayRunner

class DeterminismResult:
    def __init__(self, deterministic: bool, drift_sources: list, replay_mismatches: list, unstable_agents: list, variance_score: float):
        self.deterministic = deterministic
        self.drift_sources = drift_sources
        self.replay_mismatches = replay_mismatches
        self.unstable_agents = unstable_agents
        self.propagation_variance_score = variance_score

class DeterminismValidator:
    """Master validator for ensuring deterministic orchestration outputs."""

    def __init__(self):
        self.comparator = StateComparator()
        self.drift = DriftAnalyzer()
        self.runner = ReplayRunner()

    def validate_orchestration_cycle(self, base_state: dict, events: list, expected_state: dict) -> DeterminismResult:
        """
        Replays the cycle and generates a comprehensive determinism report.
        """
        replay_result = self.runner.execute_test_run(base_state, events, expected_state)

        is_deterministic = replay_result["is_deterministic"]
        drift_sources = list(replay_result["drift_sources"].keys())

        return DeterminismResult(
            deterministic=is_deterministic,
            drift_sources=drift_sources,
            replay_mismatches=drift_sources if not is_deterministic else [],
            unstable_agents=["unknown"] if not is_deterministic else [],
            variance_score=replay_result["variance_score"]
        )
