"""Derive portfolio projects from resume entities when LLM extraction returns none."""

from __future__ import annotations

import re
from typing import Any

_PROJECT_KEYWORDS = re.compile(
    r"\b(built|developed|designed|created|implemented|architected|engineered|launched|deployed|project)\b",
    re.IGNORECASE,
)


def derive_projects_from_entities(raw_entities: dict[str, Any]) -> list[dict[str, Any]]:
    """Return projects from parsed data, or heuristically from experience entries."""
    projects = raw_entities.get("projects") or []
    if isinstance(projects, list) and projects:
        return [p for p in projects if isinstance(p, dict) and (p.get("name") or p.get("project_name"))]

    experience = raw_entities.get("experience") or []
    if not isinstance(experience, list):
        return []

    derived: list[dict[str, Any]] = []
    for entry in experience:
        if not isinstance(entry, dict):
            continue
        title = (entry.get("title") or "").strip()
        company = (entry.get("company") or "").strip()
        description = (entry.get("description") or "").strip()
        skills_used = entry.get("skills_used") or []
        if not isinstance(skills_used, list):
            skills_used = []

        combined = f"{title} {description}"
        if not _PROJECT_KEYWORDS.search(combined) and not skills_used:
            continue

        name = title or company or "Professional project"
        if company and title and company.lower() not in title.lower():
            name = f"{title} @ {company}"

        derived.append({
            "name": name,
            "description": description or None,
            "technology_stack": skills_used,
            "role": title or None,
        })

    return derived[:8]
