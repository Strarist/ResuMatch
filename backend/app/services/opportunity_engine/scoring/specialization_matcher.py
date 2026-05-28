"""Specialization matcher for target career opportunities.

Measures direct semantic alignment between the candidate's strategic domain specialization
and the opportunity profile domain context.
"""
from typing import List

SPECIALIZATION_KEYWORDS = {
    "React & Node Ecosystems": ["react", "node", "frontend", "full stack", "fullstack", "ui", "web", "javascript", "typescript"],
    "Large Models & GPU Infrastructure": ["gpu", "cuda", "pytorch", "tensorflow", "ml", "ai", "machine learning", "large language", "vllm", "llm"],
    "Platform Infrastructure Lead": ["devops", "platform", "infrastructure", "kubernetes", "k8s", "docker", "aws", "gcp", "terraform", "sre"],
    "Software Engineering": ["engineer", "developer", "software", "backend", "fullstack", "coding"]
}

def evaluate_specialization_fit(candidate_spec: str, opportunity_title: str, opportunity_stack: str) -> float:
    """Analyze semantic overlap between active specialization context and job specifications.
    
    Returns fit index between 0.0 and 1.0.
    """
    if not candidate_spec or not opportunity_title:
        return 0.5
        
    spec_clean = candidate_spec.strip()
    title_lower = opportunity_title.lower()
    stack_lower = opportunity_stack.lower() if opportunity_stack else ""
    
    # 1. Direct sub-string match check
    if spec_clean.lower() in title_lower:
        return 1.0
        
    # 2. Key phrase alignment mapping
    matched_phrases = []
    # Identify key category
    for category, keywords in SPECIALIZATION_KEYWORDS.items():
        if category.lower() in spec_clean.lower() or spec_clean.lower() in category.lower():
            # Matches category! Count keyword occurrences
            match_count = 0
            for kw in keywords:
                if kw in title_lower or kw in stack_lower:
                    match_count += 1
            if match_count > 0:
                return min(1.0, 0.70 + (match_count * 0.10))
                
    # 3. Fallback generic match
    return 0.60
