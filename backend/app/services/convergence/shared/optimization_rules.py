# Constants and rules for structural convergence and reliability calibration

# Minimum allowed limits for optimization safely
MIN_QUEUE_DEPTH = 10
MAX_TOPOLOGY_DEPTH = 12

# Telemetry compression ratio targets
TARGET_TELEMETRY_REDUCTION_COEFFICIENT = 0.75  # 75% savings target

# Dynamic weights for overall coherence calculation
COHERENCE_WEIGHTS = {
    "orchestration_simplification": 0.25,
    "replay_alignment": 0.25,
    "telemetry_compression": 0.20,
    "reliability_calibration": 0.15,
    "abstraction_pruning": 0.15
}

# Trust calibration parameters
CALIBRATION_COOLDOWN_INTERVAL_SECONDS = 60.0
BASE_STABILITY_CALIBRATION_FACTOR = 1.05  # Scale up stability tolerances under extended healthy operations
