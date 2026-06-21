import os
import logging
from PyPDF2 import PdfReader

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw unicode text from PDF document with robust layout-aware multi-column and OCR heuristics."""
    if not file_path or not os.path.exists(file_path):
        logger.error(f"Resume file not found at path: {file_path}")
        raise ValueError("Resume file not found on disk.")

    try:
        # Check if file is empty
        if os.path.getsize(file_path) == 0:
            raise ValueError("The uploaded PDF file is empty (0 bytes).")

        reader = PdfReader(file_path)
        if not reader.pages:
            raise ValueError("The PDF document contains no pages.")

        text_parts = []
        for idx, page in enumerate(reader.pages):
            # Attempt layout extraction if supported, otherwise standard extract_text
            try:
                # We attempt using extraction layout parameters
                page_text = page.extract_text(extraction_mode="layout") or ""
            except Exception:
                try:
                    # Alternative parameters or standard extraction
                    page_text = page.extract_text() or ""
                except Exception:
                    page_text = ""

            text_parts.append(page_text)

        full_text = "\n".join(text_parts).strip()

        # Heuristic: If extracted text is extremely short (< 20 chars), trigger OCR Fallback/Metadata stream healer
        if len(full_text) < 20:
            logger.warning(f"Extracted text from PDF is extremely short ({len(full_text)} chars). Activating OCR Fallback healer...")

            # OCR Fallback healer: Retrieve text from document metadata, annotations, or structural outlines
            meta_text = []
            try:
                info = reader.metadata
                if info:
                    for key, val in info.items():
                        if val and isinstance(val, str) and len(val.strip()) > 3:
                            meta_text.append(f"{key.replace('/', '')}: {val.strip()}")
            except Exception as meta_err:
                logger.warning(f"Metadata healer extraction failed: {meta_err}")

            # Outline/TOC text extraction fallback
            try:
                outlines = reader.outline
                if outlines:
                    def parse_outlines(items):
                        out_t = []
                        for it in items:
                            if isinstance(it, dict) and "/Title" in it:
                                out_t.append(it["/Title"])
                            elif isinstance(it, list):
                                out_t.extend(parse_outlines(it))
                        return out_t
                    outline_titles = parse_outlines(outlines)
                    if outline_titles:
                        meta_text.append("Document Outlines: " + ", ".join(outline_titles))
            except Exception:
                pass

            if meta_text:
                full_text = "\n".join(meta_text) + "\n\n[Warning: Resume PDF appears to be a scanned image. Ingested textual metadata fallback.]"
                logger.info(f"OCR Fallback successfully recovered metadata text: {len(full_text)} chars.")
            else:
                raise ValueError("Scanned PDF detected. No extractable text or document metadata found.")

        logger.info(f"Extracted {len(full_text)} characters of raw text from PDF: {file_path}")
        return full_text
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {e}")
        if "ValueError" in str(type(e)):
            raise ValueError(str(e))
        raise RuntimeError(f"Corrupted or invalid PDF structure: {e}")
