"""Manager for OnboardingState."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import OnboardingState
from loguru import logger

async def get_onboarding_state(session: AsyncSession, user_id: str) -> OnboardingState:
    """Retrieve or create the onboarding state for a user."""
    stmt = select(OnboardingState).where(OnboardingState.user_id == user_id)
    result = await session.execute(stmt)
    state = result.scalar_one_or_none()

    if not state:
        state = OnboardingState(user_id=user_id)
        session.add(state)
        await session.commit()
        await session.refresh(state)

    return state

async def update_onboarding_state(session: AsyncSession, user_id: str, updates: dict) -> OnboardingState:
    """Update partial onboarding fields."""
    state = await get_onboarding_state(session, user_id)

    for key, value in updates.items():
        if hasattr(state, key):
            setattr(state, key, value)

    await session.commit()
    await session.refresh(state)
    logger.info(f"Updated onboarding state for user {user_id}: {updates}")
    return state
