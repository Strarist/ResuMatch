"""Confidence ranker for technical skills and extraction schemas.

Evaluates parsed entities based on structural evidence (co-occurrences in skills blocks,
experience, projects) to assign highly realistic confidence scores.
"""
from typing import List, Dict, Any

def evaluate_extraction_confidence(parsed_data: Dict[str, Any]) -> float:
    """Calculate overall parsed resume confidence based on structural fields completeness.
    
    Returns a score between 0.0 and 1.0.
    """
    if not parsed_data:
        return 0.0
        
    score = 0.0
    
    # 1. Metadata check (name, email, phone)
    metadata = parsed_data.get("metadata", {})
    if isinstance(metadata, dict):
        if metadata.get("name"):
            score += 0.10
        if metadata.get("email"):
            score += 0.05
        if metadata.get("phone") or metadata.get("location"):
            score += 0.05
            
    # 2. Skills check
    skills = parsed_data.get("skills", [])
    if isinstance(skills, list) and len(skills) > 0:
        score += min(0.30, len(skills) * 0.03)  # Up to 30% for skills
        
    # 3. Experience check
    experience = parsed_data.get("experience", [])
    if isinstance(experience, list) and len(experience) > 0:
        score += min(0.30, len(experience) * 0.15)  # Up to 30% for professional history
        
    # 4. Projects check
    projects = parsed_data.get("projects", [])
    if isinstance(projects, list) and len(projects) > 0:
        score += min(0.20, len(projects) * 0.10)  # Up to 20% for project evidence
        
    return min(1.0, max(0.1, score))

def assign_skill_confidence_weights(
    skills: List[str],
    experience: List[Dict[str, Any]],
    projects: List[Dict[str, Any]]
) -> Dict[str, float]:
    """Analyze the co-occurrence of skills in experience descriptions and project stacks.
    
    Returns a mapping of skill -> confidence score (0.0 to 1.0) based on structural evidence.
    """
    weights: Dict[str, float] = {}
    
    # Pre-parse occurrences inside experience & projects to save iterations
    exp_skill_sets = []
    for exp in experience:
        if isinstance(exp, dict):
            # Check skills_used or description text
            skills_used = [s.lower() for s in exp.get("skills_used", []) if isinstance(s, str)]
            desc = exp.get("description", "").lower()
            exp_skill_sets.append((skills_used, desc))
            
    proj_skill_sets = []
    for proj in projects:
        if isinstance(proj, dict):
            tech_stack = [t.lower() for t in proj.get("technology_stack", []) if isinstance(t, str)]
            desc = proj.get("description", "").lower()
            proj_skill_sets.append((tech_stack, desc))

    for skill in skills:
        skill_lower = skill.lower()
        has_experience_ref = False
        has_project_ref = False
        
        # Check in experience
        for exp_skills, exp_desc in exp_skill_sets:
            if skill_lower in exp_skills or skill_lower in exp_desc:
                has_experience_ref = True
                break
                
        # Check in projects
        for proj_techs, proj_desc in proj_skill_sets:
            if skill_lower in proj_techs or skill_lower in proj_desc:
                has_project_ref = True
                break
                
        # Calculate score based on cross-referencing evidence
        if has_experience_ref and has_project_ref:
            confidence = 0.95  # Found everywhere
        elif has_experience_ref:
            confidence = 0.90  # Work experience validated
        elif has_project_ref:
            confidence = 0.85  # Project portfolio validated
        else:
            confidence = 0.75  # Standalone self-report
            
        weights[skill] = confidence
        
    return weights
