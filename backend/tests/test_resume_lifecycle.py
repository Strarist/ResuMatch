"""Integration tests for resume upload lifecycle."""

import io
import uuid
from unittest.mock import patch, AsyncMock

import pikepdf
import pytest
from httpx import AsyncClient, ASGITransport
from pikepdf import Array, Dictionary, Name

from app.main import app as fastapi_app
from app.models.strategic_profile import StrategicProfile


def _minimal_pdf_bytes() -> bytes:
    """Build a minimal PDF with resume-like text for validation."""
    pdf = pikepdf.Pdf.new()
    content = (
        b"BT /F1 11 Tf 50 750 Td "
        b"(John Doe john@example.com Phone 555-123-4567) Tj T* "
        b"(EXPERIENCE Software Engineer at Acme Corp 2020-2024) Tj T* "
        b"(EDUCATION BS Computer Science State University) Tj T* "
        b"(SKILLS Python FastAPI React PostgreSQL Docker Kubernetes) Tj "
        b"ET"
    )
    resources = pdf.make_indirect({
        "/Font": {
            "/F1": {
                "/Type": Name("/Font"),
                "/Subtype": Name("/Type1"),
                "/BaseFont": Name("/Helvetica"),
            }
        }
    })
    content_stream = pdf.make_stream(content, compress=False)
    page_obj = Dictionary({
        "/Type": Name("/Page"),
        "/MediaBox": Array([0, 0, 612, 792]),
        "/Contents": content_stream,
        "/Resources": resources,
    })
    page = pdf.make_indirect(page_obj)
    pages = pdf.make_indirect({
        "/Type": Name("/Pages"),
        "/Kids": Array([page]),
        "/Count": 1,
    })
    pdf.Root["/Pages"] = pages
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


async def _auth_headers(client: AsyncClient) -> dict[str, str]:
    headers, _ = await _auth_context(client)
    return headers


async def _auth_context(client: AsyncClient) -> tuple[dict[str, str], str]:
    email = f"resume-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    await client.post(
        "/v1/auth/register",
        json={"name": "Resume Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    body = login.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


async def _mock_build_and_persist(db, user_id: str, file_path: str, resume_id: str | None = None):
    profile = StrategicProfile(
        user_id=user_id,
        inferred_skills=["Python", "FastAPI", "React"],
        active_specialization="Full Stack Engineering",
        target_role="Senior Software Engineer",
        trajectory_state={"dominant_path": "Full Stack", "competitiveness_score": 0.8},
    )
    db.add(profile)
    await db.flush()
    enrich_ctx = {
        "normalized_skills": ["Python", "FastAPI", "React"],
        "gaps": [],
        "target_role": "Senior Software Engineer",
        "specialization": "Full Stack Engineering",
        "trajectory": {"dominant_path": "Full Stack", "competitiveness_score": 0.8, "readiness_scores": {}},
        "dominant_readiness": {},
    }
    return profile, {"skills": ["Python", "FastAPI", "React"]}, enrich_ctx


@pytest.mark.asyncio
async def test_resume_upload_and_list(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _auth_headers(client)
        pdf_bytes = _minimal_pdf_bytes()

        upload_resp = await client.post(
            "/v1/resumes",
            headers=headers,
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert upload_resp.status_code == 200, upload_resp.text
        assert upload_resp.json()["resume_id"]

        list_resp = await client.get("/v1/resumes", headers=headers)
        assert list_resp.status_code == 200
        resumes = list_resp.json()["resumes"]
        assert len(resumes) >= 1
        assert resumes[0]["filename"] == "resume.pdf"
        assert resumes[0]["parse_status"] in {"pending", "processing", "completed", "failed"}


@pytest.mark.asyncio
@patch(
    "app.services.resume_pipeline.profile_builder.enrich_profile_after_parse",
    new_callable=AsyncMock,
)
@patch(
    "app.services.resume_pipeline.profile_builder.build_and_persist_strategic_profile",
    side_effect=_mock_build_and_persist,
)
async def test_upload_parse_creates_strategic_profile(_mock_build, _mock_enrich, test_engine):
    from app.routers.resumes import _run_parse_background

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _auth_context(client)
        pdf_bytes = _minimal_pdf_bytes()

        upload_resp = await client.post(
            "/v1/resumes",
            headers=headers,
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert upload_resp.status_code == 200, upload_resp.text
        resume_id = upload_resp.json()["resume_id"]

        await _run_parse_background(resume_id, user_id)

        profile_resp = await client.get("/v1/strategic/profile", headers=headers)
        assert profile_resp.status_code == 200
        profile = profile_resp.json()
        assert len(profile["skills"]) >= 1

        list_resp = await client.get("/v1/resumes", headers=headers)
        assert list_resp.status_code == 200
        resumes = list_resp.json()["resumes"]
        assert resumes[0]["parse_status"] == "completed"

        lifecycle_resp = await client.get("/v1/strategic/lifecycle", headers=headers)
        assert lifecycle_resp.status_code == 200
        assert lifecycle_resp.json()["has_strategic_profile"] is True


@pytest.mark.asyncio
async def test_resume_preview_returns_extraction_fields(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _auth_headers(client)
        pdf_bytes = _minimal_pdf_bytes()

        preview_resp = await client.post(
            "/v1/resumes/preview",
            headers=headers,
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert preview_resp.status_code == 200, preview_resp.text
        preview = preview_resp.json()
        assert "skills" in preview
        assert isinstance(preview["skills"], list)
        assert "target_role" in preview
        assert "specialization" in preview
        assert "confidence_score" in preview


@pytest.mark.asyncio
async def test_strategic_profile_empty_before_parse(test_engine):
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers = await _auth_headers(client)
        profile_resp = await client.get("/v1/strategic/profile", headers=headers)
        assert profile_resp.status_code == 200
        profile = profile_resp.json()
        assert profile["skills"] == [] or profile["completeness_score"] == 0


@pytest.mark.asyncio
@pytest.mark.critical
@patch(
    "app.services.resume_pipeline.profile_builder.build_and_persist_strategic_profile",
    side_effect=RuntimeError("simulated parse failure"),
)
async def test_parse_failure_sets_failed_status(_mock_build, test_engine):
    from app.routers.resumes import _run_parse_background

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _auth_context(client)
        pdf_bytes = _minimal_pdf_bytes()

        upload_resp = await client.post(
            "/v1/resumes",
            headers=headers,
            files={"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        )
        assert upload_resp.status_code == 200, upload_resp.text
        resume_id = upload_resp.json()["resume_id"]

        await _run_parse_background(resume_id, user_id)

        list_resp = await client.get("/v1/resumes", headers=headers)
        assert list_resp.status_code == 200
        resumes = list_resp.json()["resumes"]
        failed = next((r for r in resumes if r["id"] == resume_id), None)
        assert failed is not None
        assert failed["parse_status"] == "failed"
        assert failed.get("parse_error")
