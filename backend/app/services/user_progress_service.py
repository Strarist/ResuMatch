"""User progression service tracking real career milestones, uploads, and scores."""
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_progress import UserProgress

logger = logging.getLogger(__name__)

async def get_user_progress_readonly(db: AsyncSession, user_id: str) -> UserProgress | None:
    """Read UserProgress without creating or mutating records."""
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_or_create_user_progress(db: AsyncSession, user_id: str) -> UserProgress:
    """Retrieve or initialize persistent UserProgress record, hardened against duplicates and concurrency."""
    result = await db.execute(
        select(UserProgress).where(UserProgress.user_id == user_id)
    )
    records = result.scalars().unique().all()

    if len(records) > 1:
        logger.warning(f"Duplicate UserProgress records found for user_id={user_id}. Auto-repairing.")
        progress = records[0]
        for duplicate in records[1:]:
            await db.delete(duplicate)
        await db.flush()
        return progress
    elif len(records) == 1:
        return records[0]

    # No record exists, try to create one safely using savepoints for concurrency
    progress = UserProgress(
        user_id=user_id,
        resumes_uploaded_count=0,
        completed_milestones_count=0,
        achieved_tasks_count=0,
        recruiter_score_record=0.0,
        market_readiness_record=0.0,
        evolving_specialization="General",
        progression_history=[{
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": "progression_initialized",
            "description": "User progression tracking system successfully activated."
        }]
    )

    try:
        async with db.begin_nested():
            db.add(progress)
            await db.flush()
            logger.info(f"Initialized user progress state for user: {user_id}")
            return progress
    except Exception as e:
        logger.info(f"Concurrent creation of UserProgress detected for user {user_id}: {e}. Fetching existing.")
        result = await db.execute(
            select(UserProgress).where(UserProgress.user_id == user_id)
        )
        records = result.scalars().unique().all()
        if records:
            if len(records) > 1:
                logger.warning(f"Duplicate UserProgress records found on retry for user_id={user_id}. Auto-repairing.")
                progress = records[0]
                for duplicate in records[1:]:
                    await db.delete(duplicate)
                await db.flush()
                return progress
            return records[0]
        raise



async def track_resume_upload(db: AsyncSession, user_id: str, filename: str):
    """Log resume upload and increment count."""
    progress = await get_or_create_user_progress(db, user_id)
    progress.resumes_uploaded_count += 1
    progress.progression_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "resume_uploaded",
        "description": f"Uploaded portfolio source file: {filename}"
    })
    await db.flush()
    logger.info(f"Logged resume upload for user: {user_id}")

async def track_milestone_completion(db: AsyncSession, user_id: str, skill_name: str):
    """Log milestone completion, increment counts, and raise progress."""
    progress = await get_or_create_user_progress(db, user_id)
    progress.completed_milestones_count += 1
    progress.achieved_tasks_count += 1
    progress.progression_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "milestone_completed",
        "description": f"Successfully completed strategic milestone target: {skill_name}"
    })
    await db.flush()
    logger.info(f"Logged milestone completion ({skill_name}) for user: {user_id}")

async def track_milestone_reversal(db: AsyncSession, user_id: str, skill_name: str):
    """Log milestone reversal (uncompleting a milestone), decrement counts."""
    progress = await get_or_create_user_progress(db, user_id)
    progress.completed_milestones_count = max(0, progress.completed_milestones_count - 1)
    progress.achieved_tasks_count = max(0, progress.achieved_tasks_count - 1)
    progress.progression_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "milestone_reverted",
        "description": f"Reverted strategic milestone target back to incomplete: {skill_name}"
    })
    await db.flush()
    logger.info(f"Logged milestone reversal ({skill_name}) for user: {user_id}")

async def track_score_update(
    db: AsyncSession,
    user_id: str,
    recruiter_score: float,
    market_readiness: float,
    specialization: str
):
    """Log trajectory updates and calibrate scores."""
    progress = await get_or_create_user_progress(db, user_id)
    progress.recruiter_score_record = float(recruiter_score)
    progress.market_readiness_record = float(market_readiness)
    progress.evolving_specialization = specialization
    progress.progression_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": "score_calibration",
        "description": f"Calibrated matching scores for {specialization} specialization."
    })
    await db.flush()
    logger.info(f"Logged score updates for user: {user_id}")

async def track_parsing_diagnostic(db: AsyncSession, user_id: str, status: str, details: str):
    """Log internal pipeline parsing diagnostics (success, failure, or timeout)."""
    progress = await get_or_create_user_progress(db, user_id)
    progress.progression_history.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": f"parsing_diagnostic_{status}",
        "description": f"Internal parser check: {details}"
    })
    await db.flush()
    logger.info(f"Logged parsing diagnostic '{status}' for user: {user_id}")
