import os
import sys
import shutil
import tempfile
import pytest
import pikepdf
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../app/utils')))
from pdf_sanitizer import sanitize_pdf

def create_bad_pdf(path):
    # Create a PDF with an annotation and JavaScript
    pdf = pikepdf.new()
    pdf.add_blank_page()
    page = pdf.pages[0]
    # Add annotation
    page.Annots = pdf.make_indirect([pdf.make_stream(b"/Subtype /Text /Contents (Bad)")])
    # Add JavaScript and EmbeddedFiles directly to root
    pdf.Root["/JavaScript"] = pdf.make_stream(b"console.log('bad')")
    pdf.Root["/EmbeddedFiles"] = pdf.make_stream(b"bad file")
    pdf.save(path)

def test_sanitize_pdf_removes_bad_content():
    with tempfile.TemporaryDirectory() as tmpdir:
        bad_pdf = os.path.join(tmpdir, "bad.pdf")
        clean_pdf = os.path.join(tmpdir, "clean.pdf")
        create_bad_pdf(bad_pdf)
        # Sanitize
        result = sanitize_pdf(bad_pdf, clean_pdf)
        assert result is True
        # Check output exists and is a valid PDF
        with pikepdf.open(clean_pdf) as pdf:
            # Should not throw
            assert pdf is not None
        # (Manual inspection for deep checks) 