"""Relevance Ranker — evaluates recruiter credibility and computes matching confidence scores."""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def evaluate_listing_credibility(job: Dict[str, Any]) -> Dict[str, Any]:
    """Decorates job listing with recruiter credibility indicators, source tags, and timestamps."""
    source = job.get("source", "Public Web")

    # Heuristically score source credibility
    if "Seed" in source:
        credibility_score = 0.98
        confidence_level = "High-Signal Verified"
    elif source in ("RemoteOK", "Arbeitnow"):
        credibility_score = 0.88
        confidence_level = "API Ingested"
    else:
        credibility_score = 0.75
        confidence_level = "Web Synced"

    # Ensure freshness timestamp is present (providers normalize to posted_at)
    freshness = job.get("posted_at") or job.get("created_at") or "active"

    # Return decorated profile tags
    return {
        "recruiter_credibility_score": credibility_score,
        "confidence_level": confidence_level,
        "freshness": freshness,
        "source": source
    }
