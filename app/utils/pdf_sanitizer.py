import pikepdf
import logging
from typing import Optional

def sanitize_pdf(input_path: str, output_path: Optional[str] = None) -> bool:
    """
    Deep-sanitize a PDF: remove JavaScript, embedded files, annotations, and actions.
    Overwrites the input file unless output_path is specified.
    Returns True if successful, False otherwise.
    """
    output_path = output_path or input_path
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
        return True
    except Exception as e:
        logging.error(f"PDF sanitization failed for {input_path}: {e}")
        return False 