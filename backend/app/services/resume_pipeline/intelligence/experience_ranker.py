"""Experience Ranker — aggregates work history timelines and ranks candidate seniority."""

import logging
import re
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def parse_duration_to_years(duration_str: str) -> float:
    """Heuristically parse common duration string signatures into numeric years.

    e.g. "2 years", "1 yr 6 mos", "2019 - 2022", "6 months"
    """
    clean_str = duration_str.lower().strip()

    # 1. Check for exact year indicators
    year_match = re.search(r'(\d+(\.\d+)?)\s*(yr|year)', clean_str)
    month_match = re.search(r'(\d+)\s*(mo|month)', clean_str)

    years = 0.0
    if year_match:
        years += float(year_match.group(1))
    if month_match:
        years += float(month_match.group(1)) / 12.0

    if years > 0.0:
        return years

    # 2. Check for date ranges (e.g. 2019 - 2022, 2020 - Present)
    years_found = [int(y) for y in re.findall(r'\b(20\d{2}|19\d{2})\b', clean_str)]
    if len(years_found) == 2:
        diff = abs(years_found[1] - years_found[0])
        return float(max(0.5, diff))
    elif len(years_found) == 1:
        # e.g. "2021 - present"
        from datetime import datetime
        current_year = datetime.now().year
        diff = current_year - years_found[0]
        return float(max(0.5, diff))

    # Default fallback
    return 1.0

def rank_experience_seniority(experiences: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze the list of work experience models to compute total aggregated years and a realistic seniority rank."""
    total_years = 0.0
    for exp in experiences:
        duration = exp.get("duration", "")
        if duration:
            total_years += parse_duration_to_years(duration)

    # Apply standard recruiter seniority ranking thresholds
    if total_years >= 8.0:
        rank = "Staff/Principal Engineer"
        confidence_factor = 0.95
    elif total_years >= 5.0:
        rank = "Senior Engineer"
        confidence_factor = 0.90
    elif total_years >= 2.0:
        rank = "Mid-Level Engineer"
        confidence_factor = 0.85
    else:
        rank = "Junior Engineer"
        confidence_factor = 0.80

    return {
        "aggregated_years_experience": round(total_years, 1),
        "inferred_seniority_rank": rank,
        "ranking_confidence": confidence_factor
    }
