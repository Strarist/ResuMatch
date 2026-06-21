import pikepdf
import logging
import time
import os
import tempfile
from typing import Optional
from app.logger import logger

def sanitize_pdf(input_path: str, output_path: Optional[str] = None, user_id: Optional[str] = None, session_hash: Optional[str] = None) -> bool:
    """
    Deep-sanitize a PDF: remove JavaScript, embedded files, annotations, and actions.
    Never overwrites the original input file directly.
    Creates a temporary sanitized file and atomically replaces the target file upon success.
    Returns True if successful, False otherwise.
    Logs all actions for observability and audit.
    """
    target_path = output_path or input_path
    start_time = time.time()

    # Base logging context without the mutable status field
    base_log_context = {
        "user_id": user_id,
        "session_hash": session_hash,
        "filename": input_path,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    # Log start of sanitization
    logger.bind(**base_log_context, severity="info").info("Sanitization started")

    # Determine directory for temporary file to allow atomic replacement
    out_dir = os.path.dirname(target_path) or "."
    temp_fd, temp_path = tempfile.mkstemp(suffix=".tmp", dir=out_dir)
    os.close(temp_fd)
    try:
        os.remove(temp_path)
    except Exception:
        pass

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
            pdf.save(temp_path)

        # Atomically replace target file after successful save and close
        os.replace(temp_path, target_path)

        duration = time.time() - start_time
        # Log successful completion
        logger.bind(
            **base_log_context,
            sanitization_status="success",
            duration=duration,
            severity="info",
        ).info("Sanitization successful")
        return True
    except Exception as e:
        duration = time.time() - start_time
        # Clean up temporary file if it was created
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        # Log failure with error details
        logger.bind(
            **base_log_context,
            sanitization_status="failed",
            failure_reason=str(e),
            duration=duration,
            severity="error",
        ).exception("Sanitization failed")
        return False
