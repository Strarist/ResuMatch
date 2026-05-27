"""Scheduler — distributed-safe scheduled job management."""

from __future__ import annotations
import uuid
from sqlalchemy import Column, DateTime, Integer, String, Boolean, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base


class ScheduledJob(Base):
    __tablename__ = "scheduled_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_type = Column(String, nullable=False, unique=True)
    cron_expression = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    last_run = Column(DateTime(timezone=True), nullable=True)
    next_run = Column(DateTime(timezone=True), nullable=True)
    failure_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


DEFAULT_SCHEDULES = [
    {"job_type": "daily_light_refresh", "cron": "0 8 * * *"},
    {"job_type": "weekly_full_refresh", "cron": "0 6 * * 1"},
    {"job_type": "opportunity_refresh", "cron": "0 */6 * * *"},
    {"job_type": "analytics_aggregation", "cron": "0 2 * * *"},
    {"job_type": "stale_roadmap_cleanup", "cron": "0 3 * * 0"},
]


async def get_scheduled_jobs(db: AsyncSession) -> list[ScheduledJob]:
    result = await db.execute(select(ScheduledJob).where(ScheduledJob.enabled == True))
    return list(result.scalars().all())
