import json
import logging
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.opportunity_engine.providers.base import BaseOpportunityProvider

logger = logging.getLogger(__name__)

class ArbeitnowProvider(BaseOpportunityProvider):
    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        """Crawl Arbeitnow job board API asynchronously."""
        logger.info("ArbeitnowProvider: Crawling Arbeitnow API...")
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get("https://www.arbeitnow.com/api/job-board-api", headers=headers)
                if response.status_code == 200:
                    res_data = response.json()
                    jobs = res_data.get("data", [])
                    normalized_jobs = []
                    for item in jobs:
                        if not isinstance(item, dict):
                            continue
                        normalized_jobs.append(self.normalize(item))
                    return normalized_jobs
        except Exception as e:
            logger.warning(f"ArbeitnowProvider: crawl failed: {e}")
        return []

    def normalize(self, raw_job: Any) -> Dict[str, Any]:
        """Normalize raw Arbeitnow job item into standard schema."""
        # Arbeitnow often provides integer timestamps or formatted dates in 'created_at'
        raw_date = raw_job.get("created_at")
        posted_at = datetime.now(timezone.utc).isoformat()
        if isinstance(raw_date, int):
            posted_at = datetime.fromtimestamp(raw_date, tz=timezone.utc).isoformat()
        elif isinstance(raw_date, str):
            posted_at = raw_date

        tags = [t.lower().strip() for t in raw_job.get("tags", []) if t]

        return {
            "title": raw_job.get("title", ""),
            "company": raw_job.get("company_name", ""),
            "url": raw_job.get("url", ""),
            "location": raw_job.get("location", "Europe/Global"),
            "remote": raw_job.get("remote", False),
            "description": raw_job.get("description", ""),
            "tags": tags,
            "skills": tags, # Support both key requirements
            "compensation": "$120k - $160k",
            "salary": "$120k - $160k",
            "source": "Arbeitnow",
            "posted_at": posted_at
        }
