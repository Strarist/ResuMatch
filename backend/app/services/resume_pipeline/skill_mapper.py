import logging
from typing import List
from app.ai.skill_normalization import normalize_skills

logger = logging.getLogger(__name__)

def map_and_normalize_skills(skills: List[str]) -> List[str]:
    """Map raw skill terms onto standard canonical career taxonomy vectors."""
    try:
        normalized = normalize_skills(skills)
        logger.info(f"Normalized {len(skills)} raw skills to {len(normalized)} canonical items.")
        return normalized
    except Exception as e:
        logger.warning(f"Skill taxonomy mapping failed: {e}. Keeping raw skills.")
        return skills
