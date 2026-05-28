"""Recruiter alignment scorer for career opportunity engine.

Evaluates evidence-based technical confidence from project portfolios and handles proof gaps.
"""
from typing import List, Dict, Any

def evaluate_recruiter_alignment(
    opportunity: Dict[str, Any],
    candidate_projects: List[Dict[str, Any]]
) -> float:
    """Assess recruiter confidence based on candidate portfolio projects and proof gaps.
    
    Returns confidence scoring index between 0.0 and 1.0.
    """
    if not opportunity:
        return 0.5
        
    score = 0.85  # Starting base confidence
    
    # 1. Penalize for missing requirements
    missing_reqs = opportunity.get("missingRequirements", [])
    if isinstance(missing_reqs, list) and missing_reqs:
        score -= min(0.30, len(missing_reqs) * 0.10)
        
    # 2. Penalize for proof gaps (evidence deficits)
    proof_gaps = opportunity.get("proofGaps", [])
    if isinstance(proof_gaps, list) and proof_gaps:
        score -= min(0.20, len(proof_gaps) * 0.05)
        
    # 3. Boost score based on solid project stack match
    if isinstance(candidate_projects, list) and candidate_projects:
        stack_comp = opportunity.get("stackCompatibility", "")
        if isinstance(stack_comp, str) and stack_comp:
            comp_lower = stack_comp.lower()
            project_tech_matches = 0
            
            for proj in candidate_projects:
                if not isinstance(proj, dict):
                    continue
                techs = proj.get("technology_stack", [])
                if isinstance(techs, list):
                    for tech in techs:
                        if isinstance(tech, str) and tech.lower() in comp_lower:
                            project_tech_matches += 1
                            
            if project_tech_matches > 0:
                score += min(0.15, project_tech_matches * 0.05)
                
    return float(round(min(1.0, max(0.2, score)), 2))
