import pytest
from fastapi.testclient import TestClient
from app.schemas.common import ErrorCodes
from app.tests.conftest import assert_success_response, assert_error_response, assert_paginated_response

def test_create_resume_success(authorized_client: TestClient):
    """Test successful resume creation"""
    resume_data = {
        "title": "Senior Developer Resume",
        "content": "Experienced Python developer with FastAPI and SQL skills.",
        "skills": ["python", "fastapi", "sql", "docker"],
        "experience": 5,
        "education": ["Master's in Computer Science"],
    }
    response = authorized_client.post("/api/v1/resumes/", json=resume_data)
    data = assert_success_response(response, 201)
    assert data["title"] == resume_data["title"]
    assert data["content"] == resume_data["content"]
    assert data["skills"] == resume_data["skills"]
    assert data["experience"] == resume_data["experience"]
    assert data["education"] == resume_data["education"]
    assert "id" in data
    assert "user_id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_create_resume_unauthorized(client: TestClient):
    """Test resume creation without authentication"""
    response = client.post("/api/v1/resumes/", json={})
    assert_error_response(response, 401, ErrorCodes.AUTH_REQUIRED)

def test_create_resume_invalid_data(authorized_client: TestClient):
    """Test resume creation with invalid data"""
    invalid_data = {
        "title": "",  # Empty title
        "content": "Test content",
        "skills": ["python"],
        "experience": -1,  # Invalid experience
        "education": ["Bachelor's"],
    }
    response = authorized_client.post("/api/v1/resumes/", json=invalid_data)
    assert_error_response(response, 422, ErrorCodes.VALIDATION_ERROR)

def test_get_resume_success(authorized_client: TestClient, test_resume: dict):
    """Test successful resume retrieval"""
    response = authorized_client.get(f"/api/v1/resumes/{test_resume['id']}")
    data = assert_success_response(response)
    assert data["id"] == test_resume["id"]
    assert data["title"] == test_resume["title"]
    assert data["content"] == test_resume["content"]
    assert data["skills"] == test_resume["skills"]
    assert data["experience"] == test_resume["experience"]
    assert data["education"] == test_resume["education"]

def test_get_resume_not_found(authorized_client: TestClient):
    """Test resume retrieval with non-existent ID"""
    response = authorized_client.get("/api/v1/resumes/00000000-0000-0000-0000-000000000000")
    assert_error_response(response, 404, ErrorCodes.RESOURCE_NOT_FOUND)

def test_get_resume_unauthorized(client: TestClient, test_resume: dict):
    """Test resume retrieval without authentication"""
    response = client.get(f"/api/v1/resumes/{test_resume['id']}")
    assert_error_response(response, 401, ErrorCodes.AUTH_REQUIRED)

def test_update_resume_success(authorized_client: TestClient, test_resume: dict):
    """Test successful resume update"""
    update_data = {
        "title": "Updated Resume Title",
        "skills": ["python", "fastapi", "sql", "docker", "kubernetes"],
    }
    response = authorized_client.patch(
        f"/api/v1/resumes/{test_resume['id']}",
        json=update_data
    )
    data = assert_success_response(response)
    assert data["id"] == test_resume["id"]
    assert data["title"] == update_data["title"]
    assert data["skills"] == update_data["skills"]
    assert data["content"] == test_resume["content"]  # Unchanged
    assert data["experience"] == test_resume["experience"]  # Unchanged

def test_update_resume_not_found(authorized_client: TestClient):
    """Test resume update with non-existent ID"""
    response = authorized_client.patch(
        "/api/v1/resumes/00000000-0000-0000-0000-000000000000",
        json={"title": "New Title"}
    )
    assert_error_response(response, 404, ErrorCodes.RESOURCE_NOT_FOUND)

def test_delete_resume_success(authorized_client: TestClient, test_resume: dict):
    """Test successful resume deletion"""
    response = authorized_client.delete(f"/api/v1/resumes/{test_resume['id']}")
    assert_success_response(response, 204)
    
    # Verify resume is deleted
    response = authorized_client.get(f"/api/v1/resumes/{test_resume['id']}")
    assert_error_response(response, 404, ErrorCodes.RESOURCE_NOT_FOUND)

def test_list_resumes_success(authorized_client: TestClient, test_resume: dict):
    """Test successful resume listing"""
    response = authorized_client.get("/api/v1/resumes/")
    assert_paginated_response(response, 1)
    data = response.json()
    assert data["items"][0]["id"] == test_resume["id"]
    assert data["items"][0]["title"] == test_resume["title"]

def test_list_resumes_pagination(authorized_client: TestClient):
    """Test resume listing with pagination"""
    # Create multiple resumes
    for i in range(15):
        authorized_client.post(
            "/api/v1/resumes/",
            json={
                "title": f"Resume {i}",
                "content": f"Content {i}",
                "skills": ["python"],
                "experience": 1,
                "education": ["Bachelor's"],
            }
        )
    
    # Test first page
    response = authorized_client.get("/api/v1/resumes/?page=1&size=10")
    data = response.json()
    assert len(data["items"]) == 10
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["size"] == 10
    assert data["pagination"]["pages"] == 2
    
    # Test second page
    response = authorized_client.get("/api/v1/resumes/?page=2&size=10")
    data = response.json()
    assert len(data["items"]) == 6  # 16 total resumes (15 new + 1 test resume)
    assert data["pagination"]["page"] == 2

def test_analyze_resume_success(authorized_client: TestClient, test_resume: dict):
    """Test successful resume analysis"""
    response = authorized_client.post(f"/api/v1/resumes/{test_resume['id']}/analyze")
    data = assert_success_response(response, 202)
    assert "analysis_id" in data
    assert "status" in data
    assert data["status"] == "processing"

def test_get_resume_matches_success(authorized_client: TestClient, test_resume: dict, test_job: dict):
    """Test successful resume matches retrieval"""
    response = authorized_client.get(f"/api/v1/resumes/{test_resume['id']}/matches")
    data = assert_success_response(response)
    assert "matches" in data
    assert isinstance(data["matches"], list)
    if data["matches"]:  # If there are any matches
        match = data["matches"][0]
        assert "job_id" in match
        assert "score" in match
        assert "created_at" in match

def test_upload_resume_file_success(authorized_client: TestClient):
    """Test successful resume file upload"""
    # Create a test PDF file
    import io
    file_content = b"%PDF-1.4\nTest PDF content"
    files = {
        "file": ("test_resume.pdf", io.BytesIO(file_content), "application/pdf")
    }
    response = authorized_client.post(
        "/api/v1/resumes/upload",
        files=files,
        data={"title": "Uploaded Resume"}
    )
    data = assert_success_response(response, 201)
    assert "id" in data
    assert data["title"] == "Uploaded Resume"
    assert "content" in data
    assert "skills" in data
    assert "experience" in data
    assert "education" in data

def test_upload_resume_invalid_file(authorized_client: TestClient):
    """Test resume upload with invalid file type"""
    import io
    file_content = b"Not a PDF file"
    files = {
        "file": ("test.txt", io.BytesIO(file_content), "text/plain")
    }
    response = authorized_client.post(
        "/api/v1/resumes/upload",
        files=files,
        data={"title": "Invalid Resume"}
    )
    assert_error_response(response, 400, ErrorCodes.VALIDATION_ERROR)

def test_upload_resume_too_large(authorized_client: TestClient):
    """Test resume upload with file too large"""
    import io
    # Create a file larger than the maximum allowed size
    file_content = b"0" * (settings.MAX_UPLOAD_SIZE + 1)
    files = {
        "file": ("large_resume.pdf", io.BytesIO(file_content), "application/pdf")
    }
    response = authorized_client.post(
        "/api/v1/resumes/upload",
        files=files,
        data={"title": "Large Resume"}
    )
    assert_error_response(response, 413, ErrorCodes.FILE_TOO_LARGE) 