"""Billing + Access Control — subscription tiers, quotas, feature gating."""

import uuid

from sqlalchemy import Column, DateTime, Integer, JSON, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

TIER_LIMITS = {
    "free": {"recomputes": 10, "exports": 3, "workspace_messages": 50, "recruiter_views": 5},
    "pro": {"recomputes": 999, "exports": 50, "workspace_messages": 999, "recruiter_views": 50},
    "recruiter": {"recomputes": 999, "exports": 100, "workspace_messages": 999, "recruiter_views": 999},
    "enterprise": {"recomputes": 9999, "exports": 9999, "workspace_messages": 9999, "recruiter_views": 9999},
}


class SubscriptionProfile(Base):
    __tablename__ = "subscription_profiles"

    user_id = Column(String(36), primary_key=True)
    tier = Column(String, default="free")
    quota_usage = Column(JSON, default=dict)  # {"recomputes": 3, "exports": 1, ...}
    billing_status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


async def get_or_create_subscription(db: AsyncSession, user_id: str) -> SubscriptionProfile:
    result = await db.execute(select(SubscriptionProfile).where(SubscriptionProfile.user_id == user_id))
    sub = result.scalar_one_or_none()
    if not sub:
        sub = SubscriptionProfile(user_id=user_id, quota_usage={})
        db.add(sub)
        await db.flush()
    return sub


def check_quota(subscription: SubscriptionProfile, action: str) -> bool:
    """Check if user has quota remaining for action."""
    limits = TIER_LIMITS.get(subscription.tier, TIER_LIMITS["free"])
    usage = subscription.quota_usage or {}
    current = usage.get(action, 0)
    limit = limits.get(action, 0)
    return current < limit


async def increment_usage(db: AsyncSession, subscription: SubscriptionProfile, action: str) -> None:
    """Increment usage counter for an action."""
    usage = dict(subscription.quota_usage or {})
    usage[action] = usage.get(action, 0) + 1
    subscription.quota_usage = usage
    await db.flush()
