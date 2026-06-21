"""Compensation Parser — parses and standardizes salary strings into formatted ranges."""

import logging
import re
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

def parse_compensation(comp_str: str) -> Dict[str, Any]:
    """Parse and normalize compensation text strings into structured numeric boundaries and a clean standard text range.

    Returns a dict with:
        "raw": original string
        "min_amount": float or None
        "max_amount": float or None
        "formatted": cleaned up string representation (e.g. "$140,000 - $185,000")
    """
    fallback = {
        "raw": comp_str,
        "min_amount": None,
        "max_amount": None,
        "formatted": comp_str or "$140,000 - $180,000"
    }

    if not comp_str or not isinstance(comp_str, str):
        return fallback

    # Remove commas, currencies, spaces
    clean_str = comp_str.replace(",", "").replace("USD", "").replace("$", "").strip().lower()

    # Check for "k" multipliers (e.g. 140k -> 140000)
    # We substitute e.g. "140k" with "140000"
    clean_str = re.sub(r'(\d+)\s*k', lambda m: str(int(m.group(1)) * 1000), clean_str)

    # Extract all digits or groups of digits
    numbers = [float(n) for n in re.findall(r'\d+', clean_str)]

    if not numbers:
        return fallback

    if len(numbers) == 1:
        # Single value
        amount = numbers[0]
        # Heuristically check if this is a yearly salary or hourly rate (e.g. $80/hr)
        if amount < 1000:
            # Hourly or similar
            formatted = f"${amount:,.0f}/hr"
            return {
                "raw": comp_str,
                "min_amount": amount,
                "max_amount": amount,
                "formatted": formatted
            }
        else:
            formatted = f"${amount:,.0f}"
            return {
                "raw": comp_str,
                "min_amount": amount,
                "max_amount": amount,
                "formatted": formatted
            }

    # Two or more values, take the first two as min and max
    val1, val2 = numbers[0], numbers[1]
    min_val = min(val1, val2)
    max_val = max(val1, val2)

    # Check for hourly rates heuristics
    if max_val < 1000:
        formatted = f"${min_val:,.0f} - ${max_val:,.0f}/hr"
    else:
        formatted = f"${min_val:,.0f} - ${max_val:,.0f}"

    return {
        "raw": comp_str,
        "min_amount": min_val,
        "max_amount": max_val,
        "formatted": formatted
    }


def compensation_midpoint(comp_data: Dict[str, Any], default: float = 150000.0) -> float:
    """Compute salary midpoint safely when min/max may be partially missing."""
    min_amt = comp_data.get("min_amount")
    max_amt = comp_data.get("max_amount")
    if min_amt is not None and max_amt is not None:
        return (float(min_amt) + float(max_amt)) / 2
    if min_amt is not None:
        return float(min_amt)
    if max_amt is not None:
        return float(max_amt)
    return default
