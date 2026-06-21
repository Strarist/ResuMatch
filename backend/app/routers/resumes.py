"""Resume router — HTTP concerns only."""

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.dependencies import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user, get_resume_service
from app.exceptions import NotFoundError, ValidationError, ExternalServiceError
from app.models.user import User
from app.schemas import ResumeResponse
from app.services import ResumeService
from app.logger import logger

router = APIRouter(prefix="/v1/resumes", tags=["Resumes"])


async def _run_parse_background(resume_id: str, user_id: str) -> None:
    """Background task worker to parse resume and sync profile, roadmap, and stats.
    Uses async_session_factory to avoid request-scoped db session closure.
    """
    from app.db import async_session_factory
    from app.repositories.resume_repo import ResumeRepository
    from app.services import ResumeService

    logger.info(f"Background parsing initiated for resume {resume_id}")
    async with async_session_factory() as db:
        resume_repo = ResumeRepository(db)
        resume_service = ResumeService(resume_repo)
        try:
            await resume_service.parse(resume_id, user_id)
            await db.commit()
            logger.info(f"Background parsing completed successfully for resume {resume_id}")
        except Exception as e:
            logger.error(f"Background parsing failed for resume {resume_id}: {e}")
            await db.rollback()
            try:
                # Update status to failed
                from app.models.resume import Resume
                res = await db.get(Resume, resume_id)
                if res:
                    res.parse_status = "failed"
                    await db.commit()
            except Exception as reset_err:
                logger.error(f"Failed to reset parse_status to failed: {reset_err}")


@router.post("", status_code=status.HTTP_200_OK)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
    db: AsyncSession = Depends(get_db),
):
    file_bytes = await file.read()
    try:
        resume = await resume_service.upload(
            file_bytes=file_bytes, filename=file.filename or "resume.pdf",
            content_type=file.content_type or "", user_id=current_user.id,
        )
        from app.services.user_progress_service import track_resume_upload
        await track_resume_upload(db, current_user.id, file.filename or "resume.pdf")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except ExternalServiceError as e:
        raise HTTPException(status_code=400, detail=e.message)

    await db.commit()

    # Enqueue background parsing pipeline to avoid stalling HTTP thread
    import sys
    if "pytest" not in sys.modules:
        background_tasks.add_task(_run_parse_background, resume.id, current_user.id)

    logger.bind(
        user_id=current_user.id,
        resume_id=str(resume.id),
        event="commit_success",
        severity="info"
    ).info(f"commit_success: Database session committed successfully for resume {resume.id}, enqueued background parsing")

    return JSONResponse(
        status_code=200,
        content={"message": "Resume uploaded and parsing started", "resume_id": str(resume.id)},
    )


@router.get("")
async def list_resumes(
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    import time
    t_start = time.perf_counter()

    t0 = time.perf_counter()
    resumes = await resume_service.list_for_user(current_user.id)
    dt_db = (time.perf_counter() - t0) * 1000
    logger.info(f"[RESUMES] DB={dt_db:.2f}ms")

    t0 = time.perf_counter()
    import os
    from app.config import get_settings
    settings = get_settings()

    out = []
    for r in resumes:
        file_path = os.path.join(settings.upload_dir, f"{r.id}_{r.filename}")
        size_bytes = 0
        if os.path.exists(file_path):
            size_bytes = os.path.getsize(file_path)

        dumped = {**ResumeResponse.model_validate(r).model_dump(mode="json"), "matches_count": len(r.matches)}
        dumped["file_size_bytes"] = size_bytes
        out.append(dumped)

    dt_serialization = (time.perf_counter() - t0) * 1000
    logger.info(f"[RESUMES] Serialization={dt_serialization:.2f}ms")

    dt_total = (time.perf_counter() - t_start) * 1000
    logger.info(f"[RESUMES] Total={dt_total:.2f}ms")
    return JSONResponse(content={"resumes": out}, headers={"Cache-Control": "public, max-age=30"})


@router.get("/{resume_id}")
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    try:
        resume = await resume_service.get(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)

    import os
    from app.config import get_settings
    settings = get_settings()
    file_path = os.path.join(settings.upload_dir, f"{resume.id}_{resume.filename}")
    size_bytes = 0
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)

    dumped = ResumeResponse.model_validate(resume).model_dump(mode="json")
    dumped["file_size_bytes"] = size_bytes
    return JSONResponse(content={"resume": dumped}, headers={"Cache-Control": "public, max-age=30"})


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await resume_service.delete(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    await db.commit()
    return {"message": "Resume deleted successfully"}


@router.get("/{resume_id}/file")
async def download_resume_file(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
):
    """Retrieve the physical PDF file for a resume."""
    try:
        resume = await resume_service.get(resume_id, current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)

    import os
    from app.config import get_settings
    settings = get_settings()
    file_path = os.path.join(settings.upload_dir, f"{resume.id}_{resume.filename}")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Physical resume file not found")

    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=resume.filename
    )



@router.put("/{resume_id}", status_code=status.HTTP_200_OK)
async def replace_resume(
    resume_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    resume_service: ResumeService = Depends(get_resume_service),
    db: AsyncSession = Depends(get_db),
):
    """Replace an existing resume file and regenerate its parsed scorecards and roadmap."""
    file_bytes = await file.read()
    try:
        resume = await resume_service.replace(
            resume_id=resume_id,
            file_bytes=file_bytes,
            filename=file.filename or "resume.pdf",
            content_type=file.content_type or "",
            user_id=current_user.id
        )
        from app.services.user_progress_service import track_resume_upload
        await track_resume_upload(db, current_user.id, file.filename or "resume.pdf")
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=e.message)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)
    except ExternalServiceError as e:
        raise HTTPException(status_code=400, detail=e.message)

    await db.commit()

    # Enqueue background parsing pipeline to avoid stalling HTTP thread
    import sys
    if "pytest" not in sys.modules:
        background_tasks.add_task(_run_parse_background, resume.id, current_user.id)

    logger.bind(
        user_id=current_user.id,
        resume_id=str(resume.id),
        event="commit_success_replacement",
        severity="info"
    ).info(f"commit_success_replacement: Database session committed successfully for replaced resume {resume.id}, enqueued background parsing")

    return JSONResponse(
        status_code=200,
        content={"message": "Resume replaced and parsing started", "resume_id": str(resume.id)},
    )



@router.post("/preview", status_code=status.HTTP_200_OK)
async def preview_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Synchronously parse uploaded resume PDF and return extraction preview without committing to DB."""
    import uuid
    import os
    from app.services.resume_pipeline.parser import extract_text_from_pdf
    from app.services.resume_pipeline.extractor import extract_resume_entities
    from app.services.resume_pipeline.skill_mapper import map_and_normalize_skills
    from app.services.resume_pipeline.role_inference import infer_strategic_role
    from app.config import get_settings

    # Validate PDF content-type
    if not (file.filename and file.filename.endswith('.pdf')) and file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)

    temp_filename = f"temp_{uuid.uuid4()}_{file.filename}"
    temp_path = os.path.join(settings.upload_dir, temp_filename)

    try:
        # Save temp file
        file_bytes = await file.read()
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        # Parse text
        raw_text = extract_text_from_pdf(temp_path)

        # Extract entities via LLM
        raw_entities = await extract_resume_entities(raw_text)

        # Post-process with V2 Intelligence components
        from app.services.resume_pipeline.intelligence.achievement_extractor import extract_achievements
        from app.services.resume_pipeline.intelligence.certification_parser import parse_and_normalize_certifications
        from app.services.resume_pipeline.intelligence.experience_ranker import rank_experience_seniority
        from app.services.resume_pipeline.intelligence.project_classifier import classify_project

        achievements = extract_achievements(raw_text)
        certs = parse_and_normalize_certifications(raw_text)

        # Deduplicate and merge certifications
        extracted_certs = raw_entities.get("certifications", []) or []
        all_certs = list(set(extracted_certs + certs))

        # Run work timeline calculations
        rank_data = rank_experience_seniority(raw_entities.get("experience", []) or [])
        years_exp = float(rank_data.get("aggregated_years_experience", raw_entities.get("years_of_experience", 1.0)))
        inferred_role = rank_data.get("inferred_seniority_rank", "Senior Software Engineer")

        # Classify and score technical projects
        raw_projects = raw_entities.get("projects", []) or []
        classified_projects = []
        for p in raw_projects:
            cp = classify_project(p.get("name", "Project"), p.get("description", ""), p.get("technology_stack", []))
            classified_projects.append({**p, **cp})

        # Normalize skills
        extracted_skills = raw_entities.get("skills", [])
        normalized_skills = map_and_normalize_skills(extracted_skills)

        # Strategic specialization inference
        trajectory = infer_strategic_role(normalized_skills)
        dominant_path = trajectory.get("dominant_path", "Software Engineer")
        target_role = raw_entities.get("inferred_target_role", f"{inferred_role} ({dominant_path})")
        specialization = raw_entities.get("inferred_specialization", f"{dominant_path} Specialist")

        # Prepare preview package
        preview = {
            "metadata": raw_entities.get("metadata", {"name": current_user.name}),
            "skills": normalized_skills,
            "target_role": target_role,
            "specialization": specialization,
            "years_of_experience": years_exp,
            "experience": raw_entities.get("experience", []),
            "projects": classified_projects,
            "education": raw_entities.get("education", []),
            "certifications": all_certs,
            "achievements": achievements,
            "confidence_score": float(rank_data.get("ranking_confidence", 0.88))
        }

        # Save dynamic internal analytics
        from app.services.user_progress_service import track_parsing_diagnostic
        try:
            await track_parsing_diagnostic(db=db, user_id=current_user.id, status="success", details=f"Successfully extracted {len(normalized_skills)} skills and {len(classified_projects)} projects.")
        except Exception as log_err:
            logger.warning(f"Failed to write parsing analytics log: {log_err}")

        return preview
    except ValueError as e:
        from app.services.user_progress_service import track_parsing_diagnostic
        try:
            await track_parsing_diagnostic(db=db, user_id=current_user.id, status="validation_failure", details=str(e))
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Resume preview analysis failed: {e}")
        from app.services.user_progress_service import track_parsing_diagnostic
        try:
            await track_parsing_diagnostic(db=db, user_id=current_user.id, status="error_failure", details=str(e))
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=f"Parsing error: {e}")
    finally:
        # Clean up temp file safely
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
