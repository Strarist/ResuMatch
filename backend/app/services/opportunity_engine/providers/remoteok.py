import json
import logging
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.opportunity_engine.providers.base import BaseOpportunityProvider

logger = logging.getLogger(__name__)

class RemoteOKProvider(BaseOpportunityProvider):
    async def fetch_opportunities(self) -> List[Dict[str, Any]]:
        """Crawl RemoteOK job board API asynchronously."""
        logger.info("RemoteOKProvider: Crawling RemoteOK API...")
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get("https://remoteok.com/api", headers=headers)
                if response.status_code == 200:
                    jobs = response.json()
                    if isinstance(jobs, list) and len(jobs) > 1:
                        normalized_jobs = []
                        for item in jobs[1:]:
                            if not isinstance(item, dict):
                                continue
                            normalized_jobs.append(self.normalize(item))
                        return normalized_jobs
        except Exception as e:
            logger.warning(f"RemoteOKProvider: crawl failed: {e}")
        return []

    def normalize(self, raw_job: Any) -> Dict[str, Any]:
        """Normalize raw RemoteOK job item into standard schema."""
        posted_at = raw_job.get("date") or datetime.now(timezone.utc).isoformat()
        tags = [t.lower().strip() for t in raw_job.get("tags", []) if t]

        return {
            "title": raw_job.get("position", ""),
            "company": raw_job.get("company", ""),
            "url": raw_job.get("url", ""),
            "location": raw_job.get("location", "Remote"),
            "remote": True,
            "description": raw_job.get("description", ""),
            "tags": tags,
            "skills": tags, # Support both key requirements
            "compensation": raw_job.get("salary", "$130k - $170k"),
            "salary": raw_job.get("salary", "$130k - $170k"),
            "source": "RemoteOK",
            "posted_at": posted_at
        }
