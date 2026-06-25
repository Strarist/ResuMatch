"""Opportunity Quality Control Pipeline Entrypoint."""

import logging
from typing import List, Dict, Any

from app.services.opportunity_engine.quality.stale_filter import is_job_stale
from app.services.opportunity_engine.quality.duplicate_detector import filter_duplicates
from app.services.opportunity_engine.quality.title_normalizer import clean_and_normalize_title
from app.services.opportunity_engine.quality.compensation_parser import parse_compensation
from app.services.opportunity_engine.quality.relevance_ranker import evaluate_listing_credibility
from app.services.opportunity_engine.quality.text_encoding import (
    is_garbled_text,
    sanitize_job_text_fields,
)

logger = logging.getLogger(__name__)

def sanitize_and_rank_opportunities(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Execute full Quality Control sanitization pipeline across a list of raw job opportunities.

    Pipeline Steps:
    1. Filter out stale/filled listings
    2. Validate and normalize job titles (reject gimmicky/ninja listings)
    3. Standardize compensation ranges
    4. Deduplicate close/matching records
    5. Decorate with source credibility metadata
    """
    logger.info(f"Initiating Quality Control Pipeline on {len(jobs)} jobs...")

    first_pass = []
    for job in jobs:
        # 1. Stale Filter
        if is_job_stale(job):
            continue

        # 2. Encoding repair + garbled text filter
        job = sanitize_job_text_fields(job)
        title = job.get("title", "")
        if is_garbled_text(title):
            continue

        # 3. Title Normalizer & Gimmick Filter
        norm_title, is_valid = clean_and_normalize_title(title)
        if not is_valid:
            continue

        # 4. Compensation Parser
        comp_data = parse_compensation(job.get("compensation", ""))

        # Build cleaned copy
        cleaned_job = {**job}
        cleaned_job["title"] = norm_title
        cleaned_job["compensation"] = comp_data["formatted"]
        cleaned_job["salary_bounds"] = {
            "min": comp_data["min_amount"],
            "max": comp_data["max_amount"]
        }

        first_pass.append(cleaned_job)

    # 5. Duplicate Filter
    deduped = filter_duplicates(first_pass)

    # 6. Relevance and Credibility Decoration
    final_jobs = []
    for job in deduped:
        decorations = evaluate_listing_credibility(job)
        final_jobs.append({**job, **decorations})

    logger.info(f"Quality Control Pipeline finalized. Retained {len(final_jobs)} / {len(jobs)} high-signal jobs.")
    return final_jobs
