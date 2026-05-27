from typing import Any

def format_percentage(value: float) -> str:
    """Formats float multiplier into integer percentage string (e.g. 0.85 -> '85%')."""
    return f"{int(round(value * 100))}%"

def format_saving(original: int, compacted: int) -> str:
    """Formats telemetry reduction numbers into readability logs."""
    reduction = original - compacted
    pct = (reduction / original) * 100 if original > 0 else 0.0
    return f"Saved {reduction} signals ({pct:.1f}% reduction)"
