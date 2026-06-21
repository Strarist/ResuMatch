"""Duplicate Detector — identifies and filters duplicate job listings."""

import logging
import re
from typing import List, Dict, Any, Set

logger = logging.getLogger(__name__)

def compute_jaccard_similarity(str1: str, str2: str) -> float:
    """Compute token-based Jaccard similarity between two strings."""
    words1 = set(re.findall(r'\w+', str1.lower()))
    words2 = set(re.findall(r'\w+', str2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

def filter_duplicates(jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deduplicate a list of job listings by URL and description similarity."""
    seen_urls: Set[str] = set()
    seen_signatures: List[Dict[str, Any]] = []
    unique_jobs: List[Dict[str, Any]] = []

    for job in jobs:
        # 1. Deduplicate by URL (normalized)
        url = job.get("url", "").strip().lower()
        if url:
            # Strip simple query parameters
            normalized_url = re.sub(r'\?.*$', '', url)
            if normalized_url in seen_urls:
                continue
            seen_urls.add(normalized_url)

        # 2. Deduplicate by textual content signature (Jaccard similarity on Title + Company + Description)
        title = job.get("title", "").strip().lower()
        company = job.get("company", "").strip().lower()
        desc = job.get("description", "").strip().lower()

        signature_text = f"{title} {company} {desc[:300]}"

        is_dup = False
        for sig in seen_signatures:
            # Check title + company exact match
            if sig["title"] == title and sig["company"] == company:
                is_dup = True
                break

            # Check deep description Jaccard overlap if companies match
            if sig["company"] == company and len(desc) > 50:
                sim = compute_jaccard_similarity(signature_text, sig["text"])
                if sim > 0.85:
                    is_dup = True
                    break

        if is_dup:
            logger.info(f"Filtered duplicate listing: '{job.get('title')}' at '{job.get('company')}'")
            continue

        seen_signatures.append({
            "title": title,
            "company": company,
            "text": signature_text
        })
        unique_jobs.append(job)

    return unique_jobs
