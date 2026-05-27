import math

def calculate_decay(initial_value: float, decay_rate: float, steps: int) -> float:
    """Calculates exponential decay of a metric (e.g. visibility decay)."""
    return initial_value * math.exp(-decay_rate * steps)

def calculate_growth(initial_value: float, growth_rate: float, cap: float, steps: int) -> float:
    """Calculates capped logarithmic growth (e.g. skill leverage growth)."""
    val = initial_value + (cap - initial_value) * (1 - math.exp(-growth_rate * steps))
    return min(cap, max(initial_value, val))

def interpolate(val1: float, val2: float, factor: float) -> float:
    """Interpolates between two float values."""
    factor = max(0.0, min(1.0, factor))
    return val1 + (val2 - val1) * factor
