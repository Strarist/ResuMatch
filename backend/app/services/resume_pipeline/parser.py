import logging
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw unicode text from PDF document using PyPDF2."""
    try:
        reader = PdfReader(file_path)
        text_parts = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            text_parts.append(page_text)

        full_text = "\n".join(text_parts).strip()
        logger.info(f"Extracted {len(full_text)} characters of raw text from PDF: {file_path}")
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {e}")
        raise RuntimeError(f"Failed to extract PDF text: {e}")
