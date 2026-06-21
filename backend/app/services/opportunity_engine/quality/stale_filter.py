"""Stale Listing Filter — sanitizes outdated job postings."""

from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)

def is_job_stale(job: dict) -> bool:
    """Evaluate whether a job listing is stale (older than 30 days or explicitly expired)."""
    # 1. Check description or title for explicit expiration markers
    title_lower = job.get("title", "").lower()
    desc_lower = job.get("description", "").lower()

    stale_keywords = [
        "expired", "closed", "no longer accepting",
        "position filled", "archive", "paused"
    ]

    if any(k in title_lower for k in stale_keywords) or any(k in desc_lower for k in stale_keywords):
        logger.info(f"Filtered job '{job.get('title')}' due to explicit stale keywords.")
        return True

    # 2. Check for age timestamp (providers normalize to posted_at)
    posted_at_raw = job.get("posted_at") or job.get("created_at")
    if posted_at_raw:
        try:
            dt = None
            if isinstance(posted_at_raw, str):
                for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"):
                    try:
                        dt = datetime.strptime(posted_at_raw[:19], fmt[:19]).replace(tzinfo=timezone.utc)
                        break
                    except ValueError:
                        continue
            elif isinstance(posted_at_raw, (int, float)):
                dt = datetime.fromtimestamp(posted_at_raw, tz=timezone.utc)
            else:
                dt = posted_at_raw

            if dt is not None:
                age = datetime.now(timezone.utc) - dt
                if age > timedelta(days=30):
                    logger.info(f"Filtered job '{job.get('title')}' due to age threshold: {age.days} days.")
                    return True
        except Exception as e:
            logger.warning(f"Error parsing date '{posted_at_raw}' in stale filter: {e}")

    return False
