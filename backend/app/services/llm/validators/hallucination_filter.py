"""Hallucination filter for central LLM validator layer.

Screens out fake, highly speculative, sci-fi-sounding, or overly generic
technologies often produced by LLMs when over-stimulated or hallucinating.
"""
import re
from typing import List

# Patterns of hallucinated or suspicious terminology
HALLUCINATION_PATTERNS = [
    re.compile(r"quantum-.*-broker", re.IGNORECASE),
    re.compile(r"cyber-.*", re.IGNORECASE),
    re.compile(r"omega-.*", re.IGNORECASE),
    re.compile(r"nano-.*", re.IGNORECASE),
    re.compile(r"infinity-.*", re.IGNORECASE),
    re.compile(r"ultra-.*", re.IGNORECASE),
    re.compile(r"hyper-.*", re.IGNORECASE),
    re.compile(r"stellar-.*", re.IGNORECASE),
    re.compile(r"sentient-.*", re.IGNORECASE),
    re.compile(r"cosmic-.*", re.IGNORECASE),
    re.compile(r"warp-speed-.*", re.IGNORECASE),
    re.compile(r"agi-.*", re.IGNORECASE),
    re.compile(r"singularity-.*", re.IGNORECASE),
    re.compile(r"magic-.*", re.IGNORECASE),
    re.compile(r"blockchain-quantum-.*", re.IGNORECASE),
    re.compile(r"neural-sync-.*", re.IGNORECASE),
    re.compile(r"deep-learning-matrix-.*", re.IGNORECASE),
]

SUSPICIOUS_KEYWORDS = {
    "infinity-framework", "cyber-grid", "nano-ledger", "super-quantum",
    "quantum-agi", "cybernetic", "warp-drive", "llama-infinity",
    "hyper-dimensional", "matrix-compiler", "stellar-net", "omega-protocol",
    "cognitive-mesh", "sentient-agent", "cosmic-scale", "infinite-scaling-protocol"
}

GENERIC_EXCLUSIONS = {
    "etc", "etc.", "and others", "various", "various tools", "software",
    "tools", "technologies", "all software", "advanced features", "new skills",
    "related tech", "other items", "miscellaneous"
}

def is_hallucinated_skill(skill: str) -> bool:
    """Evaluate whether a skill term is a likely LLM hallucination or noise."""
    cleaned = skill.strip().lower()
    
    # 1. Check generic exclusions
    if cleaned in GENERIC_EXCLUSIONS:
        return True
        
    # 2. Check length constraints (too long to be a real technology tag, e.g. a sentence)
    if len(cleaned) > 50:
        return True
        
    # 3. Check for specific sci-fi suspicious keywords
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in cleaned:
            return True
            
    # 4. Check regex patterns for standard hallucinated structures
    for pattern in HALLUCINATION_PATTERNS:
        if pattern.search(cleaned):
            return True
            
    return False

def filter_hallucinations(skills: List[str]) -> List[str]:
    """Filter out hallucinated skill items from a list."""
    return [skill for skill in skills if not is_hallucinated_skill(skill)]
