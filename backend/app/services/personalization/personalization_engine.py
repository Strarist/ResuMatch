"""Personalization Engine — adapts candidate weights, focus areas, and roadmap priorities dynamically."""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def calibrate_personalization(
    skills: List[str],
    target_role: str,
    specialization: str,
    completed_milestones: int
) -> Dict[str, Any]:
    """Dynamically calibrate matching weights, study pacing, and specialization evolution parameters.

    Returns structured personalization metrics to feed back into focus priorities.
    """
    # 1. Base weights for dynamic match parameters
    base_match_weight = 0.40
    base_spec_weight = 0.40

    # 2. Adjust study pacing dynamically based on milestone achievements
    if completed_milestones >= 5:
        pacing = "Accelerated Sprint"
        velocity_multiplier = 1.3
        recruiter_readiness_bonus = 8.0  # +8% recruiter attract score
    elif completed_milestones >= 2:
        pacing = "Steady Progression"
        velocity_multiplier = 1.1
        recruiter_readiness_bonus = 4.0
    else:
        pacing = "Standard Integration"
        velocity_multiplier = 1.0
        recruiter_readiness_bonus = 0.0

    # 3. Dynamic Opportunity Weighting shifts based on skill count
    skill_count = len(skills)
    if skill_count > 12:
        # High depth candidate, focus matches heavily on target role alignment
        match_weight_shift = 0.50
        spec_weight_shift = 0.30
    elif skill_count < 6:
        # Broad candidate, look for matches across similar stacks
        match_weight_shift = 0.30
        spec_weight_shift = 0.50
    else:
        match_weight_shift = base_match_weight
        spec_weight_shift = base_spec_weight

    return {
        "study_pacing_strategy": pacing,
        "velocity_multiplier": velocity_multiplier,
        "recruiter_readiness_bonus": recruiter_readiness_bonus,
        "opportunity_weights": {
            "compatibility": match_weight_shift,
            "specialization": spec_weight_shift,
            "market_demand": 0.20
        },
        "evolution_stage": "Specialization Hardening" if completed_milestones >= 3 else "Baseline Calibration"
    }
