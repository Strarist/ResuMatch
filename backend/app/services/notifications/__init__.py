"""Notifications — persistent notification system."""

import uuid

from sqlalchemy import Column, Boolean, DateTime, Index, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


class NotificationRecord(Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_read", "user_id", "read"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high, strategic
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


async def create_notification(db: AsyncSession, user_id: str, type: str, title: str, description: str = "", priority: str = "medium") -> NotificationRecord:
    n = NotificationRecord(user_id=user_id, type=type, title=title, description=description, priority=priority)
    db.add(n)
    await db.flush()
    return n


async def get_notifications(db: AsyncSession, user_id: str, unread_only: bool = False, limit: int = 20) -> list[NotificationRecord]:
    q = select(NotificationRecord).where(NotificationRecord.user_id == user_id)
    if unread_only:
        q = q.where(NotificationRecord.read == False)
    result = await db.execute(q.order_by(NotificationRecord.created_at.desc()).limit(limit))
    return list(result.scalars().all())


async def mark_read(db: AsyncSession, notification_id: str, user_id: str) -> None:
    result = await db.execute(select(NotificationRecord).where(NotificationRecord.id == notification_id, NotificationRecord.user_id == user_id))
    n = result.scalar_one_or_none()
    if n:
        n.read = True
        await db.flush()


async def mark_all_read(db: AsyncSession, user_id: str) -> None:
    result = await db.execute(select(NotificationRecord).where(NotificationRecord.user_id == user_id, NotificationRecord.read == False))
    for n in result.scalars().all():
        n.read = True
    await db.flush()
