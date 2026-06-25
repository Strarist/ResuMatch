"""Resume service — handles resume upload, validation, and lifecycle."""

import os
import time
from io import BytesIO
from PyPDF2 import PdfReader

from app.config import get_settings
from app.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.models.resume import Resume
from app.repositories.resume_repo import ResumeRepository
from app.utils.pdf_sanitizer import sanitize_pdf

MAX_PDF_PAGES = 10
MAX_TEXT_SIZE = 50 * 1024


class ResumeService:
    def __init__(self, resume_repo: ResumeRepository):
        self.resume_repo = resume_repo
        self._settings = get_settings()

    async def upload(self, *, file_bytes: bytes, filename: str, content_type: str,
                     user_id: str) -> Resume:
        """Validate, sanitize, store PDF. Returns the created Resume."""
        from app.logger import logger
        logger.bind(
            user_id=user_id,
            filename=filename,
            event="upload_started",
            severity="info"
        ).info(f"upload_started: Upload started for file {filename}")

        self._validate_pdf(file_bytes, content_type)

        # Check for duplicates by filename
        from sqlalchemy import select
        existing = await self.resume_repo.db.execute(
            select(Resume).where(Resume.user_id == user_id, Resume.filename == filename)
        )
        existing_resumes = existing.scalars().all()
        for r in existing_resumes:
            old_path = os.path.join(self._settings.upload_dir, f"{r.id}_{r.filename}")
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass
            await self.resume_repo.db.delete(r)
        await self.resume_repo.db.flush()

        # Create DB record first (model generates UUID)
        resume = await self.resume_repo.create(filename=filename, user_id=user_id)

        # Save file using the generated ID
        upload_dir = self._settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{resume.id}_{filename}")

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        logger.bind(
            user_id=user_id,
            filename=filename,
            event="upload_saved",
            severity="info"
        ).info(f"upload_saved: Saved uploaded file to {file_path}")

        try:
            if not sanitize_pdf(file_path, file_path):
                raise ExternalServiceError("PDF sanitization failed")
            logger.bind(
                user_id=user_id,
                filename=filename,
                event="pdf_sanitized",
                severity="info"
            ).info(f"pdf_sanitized: Sanitized PDF file at {file_path}")
        except ExternalServiceError:
            raise
        except Exception:
            raise ExternalServiceError("PDF sanitization failed")

        return resume

    async def list_for_user(self, user_id: str) -> list[Resume]:
        return await self.resume_repo.list_by_user(user_id)

    async def get(self, resume_id: str, user_id: str) -> Resume:
        resume = await self.resume_repo.get_by_id(resume_id, user_id)
        if not resume:
            raise NotFoundError("Resume not found")
        return resume

    async def delete(self, resume_id: str, user_id: str) -> None:
        resume = await self.get(resume_id, user_id)
        file_path = os.path.join(
            self._settings.upload_dir, f"{resume.id}_{resume.filename}"
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

            # --- Resume Classification & Validation ---
            text_lower = text.lower()

            has_experience = any(kw in text_lower for kw in [
                "experience", "work history", "employment", "positions",
                "job history", "professional background", "internship", "employment history"
            ])
            has_education = any(kw in text_lower for kw in [
                "education", "university", "college", "degree", "academic",
                "school", "gpa", "bachelor", "master", "phd", "graduated"
            ])
            has_skills = any(kw in text_lower for kw in [
                "skills", "technologies", "expertise", "languages",
                "technical skills", "core competencies", "tools", "frameworks"
            ])

            import re
            has_contact = (
                "@" in text_lower or
                any(kw in text_lower for kw in ["phone", "contact", "email", "address", "linkedin", "github", "cell", "mobile"]) or
                re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text_lower) is not None
            )

            # Identify what elements are missing
            missing = []
            if not has_experience: missing.append("Experience")
            if not has_education: missing.append("Education")
            if not has_skills: missing.append("Skills")
            if not has_contact: missing.append("Contact Information")

            # Detect rejected document patterns
            is_rejected_type = False

            # A blank PDF or one with virtually no text is not a resume
            if len(text.strip()) < 80:
                is_rejected_type = True
            # Check for invoices or bank statements
            elif any(kw in text_lower for kw in ["invoice date", "amount due", "total due", "billing address", "bank statement", "account balance", "transaction history", "payment due"]):
                is_rejected_type = True
            # Check for research papers or college assignments
            elif any(kw in text_lower for kw in ["abstract", "introduction", "methodology", "conclusion", "references", "table of contents"]) and not (has_experience and has_skills):
                is_rejected_type = True

            if len(missing) >= 2 or is_rejected_type:
                raise ValidationError(
                    "This document does not appear to be a resume.\n\n"
                    "Please upload a resume containing:\n"
                    "• Experience\n"
                    "• Education\n"
                    "• Skills\n"
                    "• Contact Information"
                )

        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"PDF parsing failed: {e}")



    async def parse(self, resume_id: str, user_id: str) -> None:
        """Run parsing pipeline on an uploaded resume. Updates resume with extracted data."""
        from app.logger import logger
        logger.bind(
            user_id=user_id,
            resume_id=resume_id,
            event="parse_started",
            severity="info"
        ).info(f"parse_started: Parsing started for resume {resume_id}")

        resume = await self.resume_repo.get_by_id(resume_id, user_id)
        if not resume:
            logger.error(f"Resume {resume_id} not found for user {user_id}")
            return

        file_path = os.path.join(self._settings.upload_dir, f"{resume.id}_{resume.filename}")
        if not os.path.exists(file_path):
            logger.bind(
                user_id=user_id,
                resume_id=resume_id,
                event="parsing_failure",
                severity="error"
            ).error(f"Resume file not found at {file_path}")
            resume.parse_status = "failed"
            await self.resume_repo.db.flush()
            return

        try:
            from app.services.resume_pipeline.profile_builder import (
                build_and_persist_strategic_profile,
                enrich_profile_after_parse,
            )
            fast_start = time.perf_counter()
            profile, raw_entities, enrich_ctx = await build_and_persist_strategic_profile(
                self.resume_repo.db, user_id, file_path, resume.id
            )
            fast_path_ms = (time.perf_counter() - fast_start) * 1000
            logger.bind(user_id=user_id, resume_id=resume_id, fast_path_ms=round(fast_path_ms, 2)).info(
                "parse_fast_path_complete: %.2fms", fast_path_ms
            )

            resume.raw_text = "\n".join(profile.inferred_skills)
            resume.skills = profile.inferred_skills
            resume.parsed_data = raw_entities
            resume.parse_status = "completed"
            await self.resume_repo.db.flush()

            from app.services.portfolio.resume_sync import sync_resume_projects_to_portfolio
            synced = await sync_resume_projects_to_portfolio(
                self.resume_repo.db, user_id, raw_entities or {}
            )
            logger.bind(user_id=user_id, synced_projects=synced).info(
                "Portfolio sync after parse: %s project(s)", synced
            )

            await self.resume_repo.db.commit()

            enrich_start = time.perf_counter()
            await enrich_profile_after_parse(
                self.resume_repo.db,
                user_id,
                resume.id,
                **enrich_ctx,
            )
            enrichment_ms = (time.perf_counter() - enrich_start) * 1000
            logger.bind(user_id=user_id, resume_id=resume_id, enrichment_ms=round(enrichment_ms, 2)).info(
                "parse_enrichment_complete: %.2fms", enrichment_ms
            )
            await self.resume_repo.db.commit()

            # Warm response caches from persisted profile (skip heavy recompute)
            from app.services.cache import cache_set, cache_invalidate
            if profile.opportunity_alignment:
                await cache_set(
                    f"opportunities:matches:{user_id}",
                    {"matches": profile.opportunity_alignment},
                    "medium",
                )
            await cache_invalidate(f"opportunities:gaps:{user_id}")
            await cache_invalidate(f"opportunities:radar:{user_id}")
            await cache_invalidate(f"market_intelligence:snapshot:{user_id}")
            await cache_invalidate(f"strategic:focus:{user_id}")
            await cache_invalidate(f"portfolio:recruiter:{user_id}")
            await cache_invalidate(f"copilot:market_snap:{user_id}")

            logger.bind(
                user_id=user_id,
                resume_id=resume_id,
                event="parsing_success",
                severity="info"
            ).info(f"Parsing successful for resume {resume_id}")

        except Exception as e:
            logger.bind(
                user_id=user_id,
                resume_id=resume_id,
                event="parsing_failure",
                severity="error"
            ).exception(f"Resume parsing failed for {resume_id}: {e}")
            resume.parse_status = "failed"
            await self.resume_repo.db.flush()
            raise e

    async def replace(self, *, resume_id: str, file_bytes: bytes, filename: str, content_type: str,
                      user_id: str) -> Resume:
        """Replace an existing resume's physical file and update metadata."""
        resume = await self.get(resume_id, user_id)

        self._validate_pdf(file_bytes, content_type)

        # Delete old file
        old_path = os.path.join(self._settings.upload_dir, f"{resume.id}_{resume.filename}")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

        # Update resume record
        from datetime import datetime, timezone
        resume.filename = filename
        resume.uploaded_at = datetime.now(timezone.utc)
        resume.parse_status = "pending"

        # Save new file
        file_path = os.path.join(self._settings.upload_dir, f"{resume.id}_{filename}")
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        try:
            if not sanitize_pdf(file_path, file_path):
                from app.exceptions import ExternalServiceError
                raise ExternalServiceError("PDF sanitization failed")
        except Exception:
            from app.exceptions import ExternalServiceError
            raise ExternalServiceError("PDF sanitization failed")

        await self.resume_repo.db.flush()
        return resume
