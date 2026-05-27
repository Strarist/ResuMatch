# Constants and scoring rules for the strategic synthesis engines

# Thresholds for drift & stagnation risks
STAGNATION_THRESHOLD_HIGH = 0.6
STAGNATION_THRESHOLD_MEDIUM = 0.3

# Leverage mapping constants
LEVERAGE_ACCELERATION_COEFF = 1.5

# Opportunity window parameters
OPPORTUNITY_URGENCY_DAYS_LIMIT = 14

# Weights of components for synthesis engine
SYNTHESIS_WEIGHTS = {
    "data_density": 0.2,
    "market_signal": 0.3,
    "recruiter_signal": 0.3,
    "execution_reliability": 0.2
}

# Domain keywords mapping
DOMAIN_SPECIALIZATION_KEYWORDS = {
    "systems": "Distributed Systems Infrastructure",
    "fastapi": "Backend Realtime Systems Design",
    "kubernetes": "Cloud-Native Container Orchestration",
    "next.js": "Premium User Interfaces & Next.js Framework",
    "typescript": "Type-Safe Application Architecture",
    "redis": "High-Performance Caching & Stream Storage"
}
