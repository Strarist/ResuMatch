"""Certification Parser — normalizes professional credentials and industry certifications."""

import logging
import re
from typing import List

logger = logging.getLogger(__name__)

# Standard industry-grade certifications maps
CERTIFICATION_TAXONOMY = {
    "AWS Certified Solutions Architect": [r"aws\s+solutions?\s+architect", r"aws\s+certified\s+solutions?\s+architect"],
    "AWS Certified Developer": [r"aws\s+developer", r"aws\s+certified\s+developer"],
    "Certified Kubernetes Administrator (CKA)": [r"\bcka\b", r"kubernetes\s+administrator"],
    "Certified Kubernetes Application Developer (CKAD)": [r"\bckad\b", r"kubernetes\s+application\s+developer"],
    "GCP Professional Cloud Architect": [r"gcp\s+cloud\s+architect", r"google\s+professional\s+cloud\s+architect"],
    "HashiCorp Certified Terraform Associate": [r"terraform\s+associate", r"terraform\s+certified"],
    "Certified ScrumMaster (CSM)": [r"\bcsm\b", r"scrummaster", r"scrum\s+master"]
}

def parse_and_normalize_certifications(text: str) -> List[str]:
    """Extract and map raw string references to normalized industry-grade professional certifications."""
    text_lower = text.lower()
    discovered = []

    for cert_name, patterns in CERTIFICATION_TAXONOMY.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                discovered.append(cert_name)
                break

    # Also heuristically pull out simple remaining strings containing "certified" or "certicate"
    lines = text.split("\n")
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue

        if "certified" in cleaned.lower() or "certification" in cleaned.lower():
            # Avoid duplicate mappings
            # Require the line to be relatively short (indicating a title/heading line)
            if len(cleaned) < 55:
                # Clean up bullet list markers
                clean_cert = re.sub(r"^[\s\*\-\+\•\.]+", "", cleaned).strip()
                # Check if it overlaps with what we already mapped
                if not any(cd.lower() in clean_cert.lower() for cd in discovered):
                    discovered.append(clean_cert)

    return list(set(discovered))
