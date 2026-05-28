"""Strategic memory context for the AI Copilot.

Loads, manages, and persists conversational session context typesafely from the
candidate's StrategicProfile, preventing strategic drift during chat interactions.
"""
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.strategic_profile import StrategicProfile

logger = logging.getLogger(__name__)

class CopilotContextMemory:
    """Manages strategic memory state for user copilot conversations."""
    
    @staticmethod
    async def get_context(db: AsyncSession, user_id: str) -> Dict[str, Any]:
        """Retrieve target role, active specialization, validated skills, and roadmap gaps.
        
        Loads directly from the StrategicProfile database entry for single-source-of-truth accuracy.
        """
        logger.info(f"Loading strategic copilot memory context for user: {user_id}")
        
        result = await db.execute(
            select(StrategicProfile).where(StrategicProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            logger.warning(f"No StrategicProfile found for user: {user_id}. Returning empty context.")
            return {
                "target_role": "Software Engineer",
                "specialization": "General Software Engineering",
                "validated_skills": [],
                "gaps": ["System Architecture Design"],
                "opportunities_count": 0
            }
            
        # Get missing skills (gaps) from recruiter signals or trajectory state
        gaps = []
        rec_signals = profile.recruiter_signals or {}
        if "roleFit" in rec_signals and rec_signals["roleFit"]:
            first_fit = rec_signals["roleFit"][0]
            if isinstance(first_fit, dict):
                gaps = first_fit.get("missing", [])
                
        if not gaps:
            # Fallback gap retrieval from trajectory_state
            traj = profile.trajectory_state or {}
            readiness = traj.get("readiness_scores", {})
            dom_path = traj.get("dominant_path", "Software Engineer")
            dom_readiness = readiness.get(dom_path, {})
            gaps = dom_readiness.get("missing_core", [])
            
        return {
            "target_role": profile.target_role or "Software Engineer",
            "specialization": profile.active_specialization or "General Software Engineering",
            "validated_skills": profile.inferred_skills or [],
            "gaps": gaps or ["System Architecture Design"],
            "opportunities_count": len(profile.opportunity_alignment or [])
        }

    @staticmethod
    async def save_context(
        db: AsyncSession, 
        user_id: str, 
        target_role: Optional[str] = None, 
        specialization: Optional[str] = None,
        skills: Optional[List[str]] = None
    ) -> bool:
        """Update individual strategic fields inside the StrategicProfile context memory."""
        logger.info(f"Updating strategic copilot memory context for user: {user_id}")
        
        result = await db.execute(
            select(StrategicProfile).where(StrategicProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            logger.error(f"Cannot save copilot context: StrategicProfile not initialized for user {user_id}")
            return False
            
        if target_role is not None:
            profile.target_role = target_role
        if specialization is not None:
            profile.active_specialization = specialization
        if skills is not None:
            profile.inferred_skills = skills
            
        await db.flush()
        return True
