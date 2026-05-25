"""Resume service — handles resume upload, validation, and lifecycle."""

import os
import uuid
from io import BytesIO

from PyPDF2 import PdfReader

from app.config import get_settings
from app.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.models import Resume
from app.repositories.resume_repo import ResumeRepository
from app.utils.pdf_sanitizer import sanitize_pdf

MAX_PDF_PAGES = 20
MAX_TEXT_SIZE = 50 * 1024


class ResumeService:
    def __init__(self, resume_repo: ResumeRepository):
        self.resume_repo = resume_repo
        self._settings = get_settings()

    async def upload(self, *, file_bytes: bytes, filename: str, content_type: str,
                     user_id: int) -> str:
        """Validate, sanitize, store PDF. Returns resume_id."""
        self._validate_pdf(file_bytes, content_type)

        resume_id = uuid.uuid4().hex
        upload_dir = self._settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{resume_id}_{filename}")

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        try:
            if not sanitize_pdf(file_path, file_path):
                raise ExternalServiceError("PDF sanitization failed")
        except ExternalServiceError:
            raise
        except Exception:
            raise ExternalServiceError("PDF sanitization failed")

        await self.resume_repo.create(id=resume_id, filename=filename, user_id=user_id)
        return resume_id

    async def list_for_user(self, user_id: int) -> list[Resume]:
        return await self.resume_repo.list_by_user(user_id)

    async def get(self, resume_id: str, user_id: int) -> Resume:
        resume = await self.resume_repo.get_by_id(resume_id, user_id)
        if not resume:
            raise NotFoundError("Resume not found")
        return resume

    async def delete(self, resume_id: str, user_id: int) -> None:
        resume = await self.get(resume_id, user_id)
        file_path = os.path.join(
            self._settings.upload_dir, f"{resume_id}_{resume.filename}"
        )
        if os.path.exists(file_path):
            os.remove(file_path)
        await self.resume_repo.delete(resume_id)

    def _validate_pdf(self, file_bytes: bytes, content_type: str) -> None:
        if file_bytes[:4] != b"%PDF":
            raise ValidationError("File is not a valid PDF (magic number mismatch)")
        if content_type not in ("application/pdf", "application/x-pdf"):
            raise ValidationError("File MIME type is not PDF")
        try:
            pdf = PdfReader(BytesIO(file_bytes))
            if len(pdf.pages) > MAX_PDF_PAGES:
                raise ValidationError(f"PDF exceeds max page limit of {MAX_PDF_PAGES}")
            text = ""
            for page in pdf.pages:
                if len(text) > MAX_TEXT_SIZE:
                    break
                text += page.extract_text() or ""
            if len(text.encode("utf-8")) > MAX_TEXT_SIZE:
                raise ValidationError("PDF text content exceeds 50KB limit")
            pdf_str = str(pdf)
            if "/JavaScript" in pdf_str or "/JS" in pdf_str:
                raise ValidationError("PDF contains JavaScript")
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"PDF parsing failed: {e}")
