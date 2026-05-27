# Constants and parameters for the resilience mitigation engines

# Recovery intervals and locks
RECOVERY_COOLDOWN_SECONDS = 30.0
MAX_EXPONENTIAL_RECONNECT_PACE = 300.0  # 5 minutes maximum

# Degradation threshold ratios
DEGRADATION_THRESHOLD_LATENCY_MS = 250.0
DEGRADATION_THRESHOLD_MEMORY_MB = 400.0

# Dynamic weights for overall survivability score vector
RESILIENCE_WEIGHTS = {
    "containment": 0.25,
    "recovery": 0.25,
    "degradation": 0.20,
    "orchestration": 0.15,
    "transport": 0.15
}
