"""Goal alignment engine — adapts roadmap weights based on user trajectory."""


def compute_alignment(
    preferred_domains: list[str],
    completed_nodes: list[str],
    deferred_nodes: list[str],
    growth_velocity: float,
) -> dict:
    """Compute focus area adjustments based on user behavior.

    Returns:
        {
            "boost_domains": [str],
            "reduce_domains": [str],
            "velocity_factor": float,
            "reason": str
        }
    """
    # Domains the user actively completes → boost
    completed_lower = set(n.lower() for n in completed_nodes)
    deferred_lower = set(n.lower() for n in deferred_nodes)

    boost = list(preferred_domains[:3])
    reduce: list[str] = []

    # If user defers frontend nodes repeatedly → reduce frontend emphasis
    frontend_deferred = sum(1 for n in deferred_lower if any(
        kw in n for kw in ["react", "css", "html", "vue", "angular", "frontend"]
    ))
    if frontend_deferred >= 2:
        reduce.append("frontend")

    # If user defers infrastructure → reduce infra
    infra_deferred = sum(1 for n in deferred_lower if any(
        kw in n for kw in ["docker", "kubernetes", "terraform", "aws", "ci/cd"]
    ))
    if infra_deferred >= 2:
        reduce.append("infrastructure")

    # Velocity factor: high velocity → more ambitious nodes
    velocity_factor = 1.0
    if growth_velocity >= 0.6:
        velocity_factor = 1.3
    elif growth_velocity <= 0.2:
        velocity_factor = 0.7

    reason = "aligned with user trajectory"
    if reduce:
        reason = f"reduced emphasis on {', '.join(reduce)} (repeatedly deferred)"
    elif growth_velocity >= 0.6:
        reason = "accelerated due to high learning velocity"

    return {
        "boost_domains": boost,
        "reduce_domains": reduce,
        "velocity_factor": velocity_factor,
        "reason": reason,
    }
