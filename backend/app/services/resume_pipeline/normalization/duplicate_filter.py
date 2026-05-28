"""Duplicate filter for technical skills parsing.

Ensures uniqueness across skill lists case-insensitively, while preserving ordering
of the original list to maintain technical precedence.
"""
from typing import List, Set

def filter_duplicate_skills(skills: List[str]) -> List[str]:
    """Filter duplicate skills from list typesafely, preserving order and case-insensitive uniqueness."""
    if not skills:
        return []
        
    seen: Set[str] = set()
    deduplicated: List[str] = []
    
    for skill in skills:
        if not skill:
            continue
        trimmed = skill.strip()
        key = trimmed.lower()
        if key and key not in seen:
            seen.add(key)
            deduplicated.append(trimmed)
            
    return deduplicated
