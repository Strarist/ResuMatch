import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.user import User
from app.models.resume import Resume
from app.schemas.common import ErrorCodes
from app.core.config import settings
from app.tests.conftest import assert_success_response, assert_error_response, assert_paginated_response

client = TestClient(app)

def test_create_resume_success(db: Session, test_user: User) -> None:
    """Test successful resume creation"""
    resume_data = {
        "title": "Software Engineer Resume",
        "content": "Experienced software engineer...",
        "skills": ["Python", "FastAPI", "React"],
        "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
        "education": ["Bachelor's in Computer Science"]
    }
    
    response = client.post("/api/v1/resumes/", json=resume_data)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == resume_data["title"]

def test_create_resume_unauthorized(db: Session) -> None:
    """Test resume creation without authentication"""
    resume_data = {"title": "Test Resume"}
    
    response = client.post("/api/v1/resumes/", json=resume_data)
    assert response.status_code == 401
    assert response.json()["error_code"] == ErrorCodes.AUTH_REQUIRED

def test_get_user_resumes(db: Session, test_user: User) -> None:
    """Test getting user's resumes"""
    # Create a test resume
    resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="Test content"
    )
    db.add(resume)
    db.commit()
    
    response = client.get("/api/v1/resumes/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Resume"

def test_get_resume_by_id(db: Session, test_user: User) -> None:
    """Test getting a specific resume by ID"""
    resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="Test content"
    )
    db.add(resume)
    db.commit()
    
    response = client.get(f"/api/v1/resumes/{resume.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Resume"

def test_get_resume_not_found(db: Session, test_user: User) -> None:
    """Test getting a non-existent resume"""
    response = client.get("/api/v1/resumes/999")
    assert response.status_code == 404

def test_update_resume(db: Session, test_user: User) -> None:
    """Test updating a resume"""
    resume = Resume(
        user_id=test_user.id,
        title="Original Title",
        content="Original content"
    )
    db.add(resume)
    db.commit()
    
    update_data = {"title": "Updated Title"}
    response = client.put(f"/api/v1/resumes/{resume.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"

def test_delete_resume(db: Session, test_user: User) -> None:
    """Test deleting a resume"""
    resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="Test content"
    )
    db.add(resume)
    db.commit()
    
    response = client.delete(f"/api/v1/resumes/{resume.id}")
    assert response.status_code == 204
    
    # Verify it's deleted
    response = client.get(f"/api/v1/resumes/{resume.id}")
    assert response.status_code == 404

def test_upload_resume_file(db: Session, test_user: User) -> None:
    """Test uploading a resume file"""
    files = {"file": ("resume.pdf", b"fake pdf content", "application/pdf")}
    data = {"title": "Uploaded Resume"}
    
    response = client.post("/api/v1/resumes/upload", files=files, data=data)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Uploaded Resume"

def test_upload_resume_file_too_large(db: Session, test_user: User) -> None:
    """Test uploading a file that's too large"""
    # Create a large file content
    large_content = b"x" * (10 * 1024 * 1024)  # 10MB
    files = {"file": ("large_resume.pdf", large_content, "application/pdf")}
    data = {"title": "Large Resume"}
    
    response = client.post("/api/v1/resumes/upload", files=files, data=data)
    assert response.status_code == 413
    assert response.json()["error_code"] == ErrorCodes.FILE_TOO_LARGE

def test_analyze_resume(db: Session, test_user: User) -> None:
    """Test resume analysis"""
    resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="Experienced Python developer with 5 years of experience"
    )
    db.add(resume)
    db.commit()
    
    response = client.post(f"/api/v1/resumes/{resume.id}/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data

def test_get_resume_matches(db: Session, test_user: User) -> None:
    """Test getting resume matches"""
    resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="Test content"
    )
    db.add(resume)
    db.commit()
    
    response = client.get(f"/api/v1/resumes/{resume.id}/matches")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_resume_validation(db: Session, test_user: User) -> None:
    """Test resume data validation"""
    invalid_data = {
        "title": "",  # Empty title should fail
        "content": "Valid content"
    }
    
    response = client.post("/api/v1/resumes/", json=invalid_data)
    assert response.status_code == 422

def test_resume_permissions(db: Session, test_user: User) -> None:
    """Test resume access permissions"""
    # Create resume for different user
    other_user = User(email="other@example.com", hashed_password="hashed")
    db.add(other_user)
    db.commit()
    
    resume = Resume(
        user_id=other_user.id,
        title="Other User's Resume",
        content="Private content"
    )
    db.add(resume)
    db.commit()
    
    # Try to access other user's resume
    response = client.get(f"/api/v1/resumes/{resume.id}")
    assert response.status_code == 403

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