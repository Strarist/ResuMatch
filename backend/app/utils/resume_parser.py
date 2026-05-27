"""Utility wrapper for resume parsing.

Provides a thin async function ``resume_parser`` that forwards to the
AI‑powered implementation in :pymod:`app.ai.resume_parser`.  This module
exists mainly to satisfy legacy import paths used in tests and older
code (e.g. ``from app.utils.resume_parser import resume_parser``).
"""

from __future__ import annotations

from typing import Optional

from app.ai.resume_parser import ParsedResume, parse_resume_ai
from app.ai import AIProvider


async def resume_parser(file_path: str, provider: Optional[AIProvider] = None) -> ParsedResume:
    """Parse a resume PDF and return a :class:`ParsedResume`.

    This is a convenience wrapper around :func:`app.ai.resume_parser.parse_resume_ai`.
    It exists to keep backward compatibility with older import locations.
    """
    return await parse_resume_ai(file_path, provider)
