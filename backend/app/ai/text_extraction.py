"""PDF text extraction with cleanup pipeline.

Extraction priority: PyMuPDF (fitz) → PyPDF2 fallback.
Handles: multi-column, noisy whitespace, unicode, malformed PDFs.
"""

import re
import logging

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract and clean text from a PDF file.

    Tries PyMuPDF first (better layout handling), falls back to PyPDF2.
    """
    text = _extract_pymupdf(file_path)
    if not text or len(text.strip()) < 50:
        text = _extract_pypdf2(file_path)
    if not text or len(text.strip()) < 50:
        raise ValueError(f"Could not extract meaningful text from {file_path}")
    return _clean_text(text)


def _extract_pymupdf(file_path: str) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        pages = []
        for page in doc:
            pages.append(page.get_text("text"))
        doc.close()
        return "\n".join(pages)
    except ImportError:
        return ""
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed: {e}")
        return ""


def _extract_pypdf2(file_path: str) -> str:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n".join(pages)
    except Exception as e:
        logger.warning(f"PyPDF2 extraction failed: {e}")
        return ""


def _clean_text(text: str) -> str:
    """Normalize whitespace, fix unicode, remove noise."""
    # Replace common unicode issues
    text = text.replace("\u2019", "'").replace("\u2018", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    text = text.replace("\u2022", "- ")  # bullet points

    # Collapse multiple spaces/tabs into single space
    text = re.sub(r"[ \t]+", " ", text)

    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove lines that are just whitespace
    lines = [line.strip() for line in text.split("\n")]
    lines = [line for line in lines if line]

    # Rejoin with single newlines
    text = "\n".join(lines)

    # Limit to ~50KB (safety)
    return text[:50000]
