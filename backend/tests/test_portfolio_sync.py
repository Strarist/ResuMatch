"""Portfolio sync API integration tests."""

import io
import uuid
from unittest.mock import AsyncMock, patch

import pikepdf
import pytest
from httpx import AsyncClient, ASGITransport
from pikepdf import Array, Dictionary, Name

from app.main import app as fastapi_app
from app.models.strategic_profile import StrategicProfile


def _minimal_pdf_bytes() -> bytes:
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
        "/Font": {"/F1": {"/Type": Name("/Font"), "/Subtype": Name("/Type1"), "/BaseFont": Name("/Helvetica")}}
    })
    content_stream = pdf.make_stream(content, compress=False)
    page_obj = Dictionary({
        "/Type": Name("/Page"),
        "/MediaBox": Array([0, 0, 612, 792]),
        "/Contents": content_stream,
        "/Resources": resources,
    })
    page = pdf.make_indirect(page_obj)
    pages = pdf.make_indirect({"/Type": Name("/Pages"), "/Kids": Array([page]), "/Count": 1})
    pdf.Root["/Pages"] = pages
    buf = io.BytesIO()
    pdf.save(buf)
    return buf.getvalue()


async def _auth_context(client: AsyncClient) -> tuple[dict[str, str], str]:
    email = f"port-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"  # pragma: allowlist secret
    await client.post(
        "/v1/auth/register",
        json={"name": "Portfolio Test", "email": email, "password": password},
    )
    login = await client.post("/v1/auth/login", json={"email": email, "password": password})
    body = login.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body["user"]["id"]


async def _mock_build_with_projects(db, user_id: str, file_path: str, resume_id: str | None = None):
    profile = StrategicProfile(
        user_id=user_id,
        inferred_skills=["Python", "FastAPI"],
        active_specialization="Backend",
        target_role="Senior Engineer",
        trajectory_state={"dominant_path": "Backend"},
    )
    db.add(profile)
    await db.flush()
    raw_entities = {
        "skills": ["Python", "FastAPI"],
        "projects": [
            {"name": "Payments API", "description": "Microservices platform", "technology_stack": ["Python", "Kafka"]},
        ],
    }
    enrich_ctx = {
        "normalized_skills": ["Python", "FastAPI"],
        "gaps": [],
        "target_role": "Senior Engineer",
        "specialization": "Backend",
        "trajectory": {"competitiveness_score": 0.8, "readiness_scores": {}},
        "dominant_readiness": {},
    }
    return profile, raw_entities, enrich_ctx


@pytest.mark.asyncio
@patch("app.services.resume_pipeline.profile_builder.enrich_profile_after_parse", new_callable=AsyncMock)
@patch(
    "app.services.resume_pipeline.profile_builder.build_and_persist_strategic_profile",
    side_effect=_mock_build_with_projects,
)
async def test_list_projects_backfills_from_resume(_mock_build, _mock_enrich, test_engine):
    from app.routers.resumes import _run_parse_background

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _auth_context(client)
        upload_resp = await client.post(
            "/v1/resumes",
            headers=headers,
            files={"file": ("resume.pdf", io.BytesIO(_minimal_pdf_bytes()), "application/pdf")},
        )
        assert upload_resp.status_code == 200, upload_resp.text
        resume_id = upload_resp.json()["resume_id"]
        await _run_parse_background(resume_id, user_id)

        projects_resp = await client.get("/v1/portfolio/projects", headers=headers)
        assert projects_resp.status_code == 200
        projects = projects_resp.json()["projects"]
        assert len(projects) == 1
        assert projects[0]["name"] == "Payments API"


@pytest.mark.asyncio
@patch("app.services.resume_pipeline.profile_builder.enrich_profile_after_parse", new_callable=AsyncMock)
@patch(
    "app.services.resume_pipeline.profile_builder.build_and_persist_strategic_profile",
    side_effect=_mock_build_with_projects,
)
async def test_sync_from_resume_is_idempotent(_mock_build, _mock_enrich, test_engine):
    from app.routers.resumes import _run_parse_background

    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        headers, user_id = await _auth_context(client)
        upload_resp = await client.post(
            "/v1/resumes",
            headers=headers,
            files={"file": ("resume.pdf", io.BytesIO(_minimal_pdf_bytes()), "application/pdf")},
        )
        assert upload_resp.status_code == 200, upload_resp.text
        await _run_parse_background(upload_resp.json()["resume_id"], user_id)

        sync1 = await client.post("/v1/portfolio/sync-from-resume", headers=headers)
        sync2 = await client.post("/v1/portfolio/sync-from-resume", headers=headers)
        assert sync1.status_code == 200
        assert sync2.status_code == 200

        projects_resp = await client.get("/v1/portfolio/projects", headers=headers)
        assert len(projects_resp.json()["projects"]) == 1
