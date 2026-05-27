"""Background Jobs — async job tracking and execution."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, Integer, JSON, String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


class JobRecord(Base):
    __tablename__ = "job_records"
    __table_args__ = (Index("ix_jobs_user_status", "user_id", "status"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_type = Column(String, nullable=False)
    user_id = Column(String(36), nullable=True, index=True)
    status = Column(String, default="queued")  # queued, processing, completed, failed, retrying
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Float, nullable=True)
    retry_count = Column(Integer, default=0)
    failure_reason = Column(String, nullable=True)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


async def enqueue_job(db: AsyncSession, job_type: str, user_id: str | None = None, payload: dict | None = None) -> JobRecord:
    job = JobRecord(job_type=job_type, user_id=user_id, payload=payload or {})
    db.add(job)
    await db.flush()
    return job


async def complete_job(db: AsyncSession, job_id: str, duration_ms: float) -> None:
    result = await db.execute(select(JobRecord).where(JobRecord.id == job_id))
    job = result.scalar_one_or_none()
    if job:
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = duration_ms
        await db.flush()


async def fail_job(db: AsyncSession, job_id: str, reason: str) -> None:
    result = await db.execute(select(JobRecord).where(JobRecord.id == job_id))
    job = result.scalar_one_or_none()
    if job:
        job.status = "failed"
        job.failure_reason = reason
        job.retry_count += 1
        await db.flush()


async def get_user_jobs(db: AsyncSession, user_id: str, limit: int = 10) -> list[JobRecord]:
    result = await db.execute(
        select(JobRecord).where(JobRecord.user_id == user_id).order_by(JobRecord.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())
