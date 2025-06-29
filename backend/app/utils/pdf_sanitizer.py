import pikepdf
import logging
import time
from typing import Optional
from app.logger import logger

def sanitize_pdf(input_path: str, output_path: Optional[str] = None, user_id: Optional[str] = None, session_hash: Optional[str] = None) -> bool:
    """
    Deep-sanitize a PDF: remove JavaScript, embedded files, annotations, and actions.
    Overwrites the input file unless output_path is specified.
    Returns True if successful, False otherwise.
    Logs all actions for observability and audit.
    """
    output_path = output_path or input_path
    start_time = time.time()
    log_context = {
        "user_id": user_id,
        "session_hash": session_hash,
        "filename": input_path,
        "sanitization_status": "started",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "severity": "info"
    }
    logger.bind(**log_context).info("Sanitization started")
    try:
        with pikepdf.open(input_path) as pdf:
            # Remove JavaScript
            if "/Names" in pdf.Root:
                names = pdf.Root["/Names"]
                for js_key in ["/JavaScript", "/JS", "/AA"]:
                    if js_key in names:
                        del names[js_key]
            # Remove embedded files
            if "/Names" in pdf.Root:
                names = pdf.Root["/Names"]
                if "/EmbeddedFiles" in names:
                    del names["/EmbeddedFiles"]
            # Remove annotations and actions from each page
            for page in pdf.pages:
                if "/Annots" in page:
                    del page["/Annots"]
                for action_key in ["/AA", "/OpenAction", "/JS"]:
                    if action_key in page:
                        del page[action_key]
            # Remove document-level actions
            for action_key in ["/OpenAction", "/AA", "/JS", "/JavaScript", "/EmbeddedFiles"]:
                if action_key in pdf.Root:
                    del pdf.Root[action_key]
            pdf.save(output_path)
        duration = time.time() - start_time
        logger.bind(
            **log_context,
            sanitization_status="success",
            duration=duration,
            severity="info"
        ).info("Sanitization successful")
        return True
    except Exception as e:
        duration = time.time() - start_time
        logger.bind(
            **log_context,
            sanitization_status="failed",
            failure_reason=str(e),
            duration=duration,
            severity="error"
        ).exception("Sanitization failed")
        return False 