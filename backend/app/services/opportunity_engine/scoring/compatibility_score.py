"""Compatibility score calculator for the opportunity intelligence engine.

Evaluates strict technical overlaps between candidate validated skills and job requirements.
"""
from typing import List, Set

def calculate_compatibility_score(candidate_skills: List[str], required_skills: List[str]) -> float:
    """Compute direct Jaccard or overlap score between candidate and required job skills.
    
    Returns a float representation of match compatibility (0.0 to 1.0).
    """
    if not required_skills:
        return 1.0  # No specific requirements matches perfectly
    if not candidate_skills:
        return 0.0  # No skills matches nothing
        
    cand_set = {s.lower().strip() for s in candidate_skills if s}
    req_set = {s.lower().strip() for s in required_skills if s}
    
    overlap = cand_set.intersection(req_set)
    
    # Standard technical overlap calculation
    score = len(overlap) / len(req_set)
    return min(1.0, max(0.0, score))
