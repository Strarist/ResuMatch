"""Market weighting engine for career opportunity matching.

Estimates hiring velocity and market demand pressure scores based on roles and urgency.
"""
from typing import Dict, Any

HIGH_DEMAND_TECHS = {
    "kubernetes", "pytorch", "fastapi", "react", "next.js", "docker", 
    "aws", "gcp", "postgresql", "typescript", "terraform", "ci/cd"
}

def calculate_market_demand_weight(opportunity: Dict[str, Any]) -> float:
    """Evaluate market demand priority and recruiter urgency.
    
    Returns a normalized weight multiplier (0.5 to 1.5).
    """
    if not opportunity:
        return 1.0
        
    weight = 1.0
    
    # 1. Evaluate urgency level
    urgency = opportunity.get("urgency", "medium").lower()
    if urgency == "high":
        weight += 0.20
    elif urgency == "low":
        weight -= 0.15
        
    # 2. Check for high-demand technology tags
    stack_comp = opportunity.get("stackCompatibility", "")
    if isinstance(stack_comp, str) and stack_comp:
        normalized_stack = stack_comp.lower()
        match_count = 0
        for tech in HIGH_DEMAND_TECHS:
            if tech in normalized_stack:
                match_count += 1
        if match_count > 0:
            weight += min(0.30, match_count * 0.10)
            
    # 3. Handle recruiter pressure indicators
    pressure = opportunity.get("recruiterPressure", "medium").lower()
    if pressure == "high":
        weight += 0.10
    elif pressure == "low":
        weight -= 0.05
        
    return float(round(min(1.5, max(0.5, weight)), 2))
