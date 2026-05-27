from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.onboarding.state_manager import get_onboarding_state, update_onboarding_state

router = APIRouter(prefix="/v1/onboarding", tags=["onboarding"])

class OnboardingUpdateSchema(BaseModel):
    current_step: Optional[str] = None
    is_complete: Optional[str] = None
    target_role: Optional[str] = None
    specialization: Optional[str] = None
    experience_level: Optional[str] = None
    github_connected: Optional[str] = None
    linkedin_connected: Optional[str] = None
    growth_priority: Optional[str] = None
    execution_intensity: Optional[str] = None

@router.get("/state")
async def fetch_onboarding_state(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    state = await get_onboarding_state(db, user.id)
    return {
        "current_step": state.current_step,
        "is_complete": state.is_complete,
        "target_role": state.target_role,
        "specialization": state.specialization,
        "experience_level": state.experience_level,
        "github_connected": state.github_connected,
        "linkedin_connected": state.linkedin_connected,
        "growth_priority": state.growth_priority,
        "execution_intensity": state.execution_intensity
    }

@router.post("/state")
async def save_onboarding_state(
    payload: OnboardingUpdateSchema,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    updates = payload.dict(exclude_unset=True)
    state = await update_onboarding_state(db, user.id, updates)
    return {"status": "success", "step": state.current_step, "is_complete": state.is_complete}
