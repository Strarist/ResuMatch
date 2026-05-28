"""Transport chaos simulation engine."""

from .transport.reconnect_storms import ReconnectStormSimulator
from .transport.heartbeat_failures import HeartbeatFailureSimulator
from .transport.payload_corruption import PayloadCorruptionSimulator
from .transport.synchronization_jitter import SynchronizationJitterSimulator

class TransportChaosEngine:
    """Engine to run transport chaos simulations.

    Each method returns a simple deterministic report dict.
    """

    def simulate_reconnect_storms(self, intensity: int = 1) -> dict:
        return ReconnectStormSimulator().run(intensity)

    def simulate_heartbeat_failures(self, loss_rate: float = 0.1) -> dict:
        return HeartbeatFailureSimulator().run(loss_rate)

    def simulate_payload_corruption(self, corruption_rate: float = 0.05) -> dict:
        return PayloadCorruptionSimulator().run(corruption_rate)

    def simulate_synchronization_jitter(self, jitter_ms: int = 100) -> dict:
        return SynchronizationJitterSimulator().run(jitter_ms)
