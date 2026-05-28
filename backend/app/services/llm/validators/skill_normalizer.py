"""Skill normalizer for central LLM validator layer.

Standardizes, cleans, and canonicalizes skill names using the resume pipeline skill taxonomy.
"""
from typing import List, Set
from app.services.resume_pipeline.normalization.skill_taxonomy import get_canonical_skill

def normalize_skill_name(skill: str) -> str:
    """Normalize a single skill term to its canonical spelling or clean standard titlecase."""
    if not skill:
        return ""
    cleaned = skill.strip()
    # Canonical mapping pass
    canonical = get_canonical_skill(cleaned)
    # If no mapping was found, format it reasonably (e.g. capitalize words or keep as is if short like iOS)
    if canonical == cleaned:
        # Check if the word is acronymous or mixed-case already
        if cleaned.isupper() or any(c.isupper() for c in cleaned):
            return cleaned
        # Otherwise standard title case
        return cleaned.title()
    return canonical

def normalize_skill_list(skills: List[str]) -> List[str]:
    """Clean, canonicalize, and deduplicate a list of skills."""
    normalized: List[str] = []
    seen: Set[str] = set()
    for skill in skills:
        if not skill:
            continue
        norm = normalize_skill_name(skill)
        if norm and norm.lower() not in seen:
            seen.add(norm.lower())
            normalized.append(norm)
    return normalized
