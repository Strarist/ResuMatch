import pytest
from fastapi.testclient import TestClient
from app.schemas.common import ErrorCodes
from app.tests.conftest import assert_success_response, assert_error_response, assert_paginated_response

def test_create_job_success(authorized_client: TestClient):
    """Test successful job creation"""
    job_data = {
        "title": "Senior Python Developer",
        "company": "Tech Corp",
        "description": "Looking for an experienced Python developer with FastAPI skills.",
        "requirements": ["python", "fastapi", "sql", "docker", "kubernetes"],
        "location": "Remote",
        "type": "full_time",
        "salary": {
            "min": 120000,
            "max": 180000,
            "currency": "USD"
        }
    }
    response = authorized_client.post("/api/v1/jobs/", json=job_data)
    data = assert_success_response(response, 201)
    assert data["title"] == job_data["title"]
    assert data["company"] == job_data["company"]
    assert data["description"] == job_data["description"]
    assert data["requirements"] == job_data["requirements"]
    assert data["location"] == job_data["location"]
    assert data["type"] == job_data["type"]
    assert data["salary"] == job_data["salary"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_create_job_unauthorized(client: TestClient):
    """Test job creation without authentication"""
    response = client.post("/api/v1/jobs/", json={})
    assert_error_response(response, 401, ErrorCodes.AUTH_REQUIRED)

def test_create_job_invalid_data(authorized_client: TestClient):
    """Test job creation with invalid data"""
    invalid_data = {
        "title": "",  # Empty title
        "company": "Tech Corp",
        "description": "Job description",
        "requirements": ["python"],
        "location": "Remote",
        "type": "invalid_type",  # Invalid job type
        "salary": {
            "min": -1000,  # Invalid salary
            "max": 100000,
            "currency": "USD"
        }
    }
    response = authorized_client.post("/api/v1/jobs/", json=invalid_data)
    assert_error_response(response, 422, ErrorCodes.VALIDATION_ERROR)

def test_get_job_success(authorized_client: TestClient, test_job: dict):
    """Test successful job retrieval"""
    response = authorized_client.get(f"/api/v1/jobs/{test_job['id']}")
    data = assert_success_response(response)
    assert data["id"] == test_job["id"]
    assert data["title"] == test_job["title"]
    assert data["company"] == test_job["company"]
    assert data["description"] == test_job["description"]
    assert data["requirements"] == test_job["requirements"]
    assert data["location"] == test_job["location"]
    assert data["type"] == test_job["type"]
    assert data["salary"] == test_job["salary"]

def test_get_job_not_found(authorized_client: TestClient):
    """Test job retrieval with non-existent ID"""
    response = authorized_client.get("/api/v1/jobs/00000000-0000-0000-0000-000000000000")
    assert_error_response(response, 404, ErrorCodes.RESOURCE_NOT_FOUND)

def test_get_job_unauthorized(client: TestClient, test_job: dict):
    """Test job retrieval without authentication"""
    response = client.get(f"/api/v1/jobs/{test_job['id']}")
    assert_error_response(response, 401, ErrorCodes.AUTH_REQUIRED)

def test_update_job_success(authorized_client: TestClient, test_job: dict):
    """Test successful job update"""
    update_data = {
        "title": "Updated Job Title",
        "salary": {
            "min": 130000,
            "max": 190000,
            "currency": "USD"
        }
    }
    response = authorized_client.patch(
        f"/api/v1/jobs/{test_job['id']}",
        json=update_data
    )
    data = assert_success_response(response)
    assert data["id"] == test_job["id"]
    assert data["title"] == update_data["title"]
    assert data["salary"] == update_data["salary"]
    assert data["company"] == test_job["company"]  # Unchanged
    assert data["description"] == test_job["description"]  # Unchanged

def test_update_job_not_found(authorized_client: TestClient):
    """Test job update with non-existent ID"""
    response = authorized_client.patch(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000000",
        json={"title": "New Title"}
    )
    assert_error_response(response, 404, ErrorCodes.RESOURCE_NOT_FOUND)

def test_delete_job_success(authorized_client: TestClient, test_job: dict):
    """Test successful job deletion"""
    response = authorized_client.delete(f"/api/v1/jobs/{test_job['id']}")
    assert_success_response(response, 204)
    
    # Verify job is deleted
    response = authorized_client.get(f"/api/v1/jobs/{test_job['id']}")
    assert_error_response(response, 404, ErrorCodes.RESOURCE_NOT_FOUND)

def test_list_jobs_success(authorized_client: TestClient, test_job: dict):
    """Test successful job listing"""
    response = authorized_client.get("/api/v1/jobs/")
    assert_paginated_response(response, 1)
    data = response.json()
    assert data["items"][0]["id"] == test_job["id"]
    assert data["items"][0]["title"] == test_job["title"]

def test_list_jobs_pagination(authorized_client: TestClient):
    """Test job listing with pagination"""
    # Create multiple jobs
    for i in range(15):
        authorized_client.post(
            "/api/v1/jobs/",
            json={
                "title": f"Job {i}",
                "company": f"Company {i}",
                "description": f"Description {i}",
                "requirements": ["python"],
                "location": "Remote",
                "type": "full_time",
                "salary": {
                    "min": 80000,
                    "max": 120000,
                    "currency": "USD"
                }
            }
        )
    
    # Test first page
    response = authorized_client.get("/api/v1/jobs/?page=1&size=10")
    data = response.json()
    assert len(data["items"]) == 10
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["size"] == 10
    assert data["pagination"]["pages"] == 2
    
    # Test second page
    response = authorized_client.get("/api/v1/jobs/?page=2&size=10")
    data = response.json()
    assert len(data["items"]) == 6  # 16 total jobs (15 new + 1 test job)
    assert data["pagination"]["page"] == 2

def test_search_jobs_success(authorized_client: TestClient, test_job: dict):
    """Test successful job search"""
    # Create additional jobs with different skills
    job_data = [
        {
            "title": "Python Developer",
            "company": "Python Corp",
            "description": "Python developer position",
            "requirements": ["python", "django"],
            "location": "Remote",
            "type": "full_time",
            "salary": {"min": 80000, "max": 120000, "currency": "USD"}
        },
        {
            "title": "Java Developer",
            "company": "Java Corp",
            "description": "Java developer position",
            "requirements": ["java", "spring"],
            "location": "On-site",
            "type": "full_time",
            "salary": {"min": 90000, "max": 130000, "currency": "USD"}
        }
    ]
    for job in job_data:
        authorized_client.post("/api/v1/jobs/", json=job)
    
    # Search for Python jobs
    response = authorized_client.get("/api/v1/jobs/search?q=python")
    data = response.json()
    assert len(data["items"]) > 0
    for job in data["items"]:
        assert "python" in [r.lower() for r in job["requirements"]]

def test_filter_jobs_success(authorized_client: TestClient):
    """Test successful job filtering"""
    # Create jobs with different types and locations
    job_data = [
        {
            "title": "Remote Python Job",
            "company": "Remote Corp",
            "description": "Remote Python position",
            "requirements": ["python"],
            "location": "Remote",
            "type": "full_time",
            "salary": {"min": 80000, "max": 120000, "currency": "USD"}
        },
        {
            "title": "On-site Java Job",
            "company": "On-site Corp",
            "description": "On-site Java position",
            "requirements": ["java"],
            "location": "New York",
            "type": "contract",
            "salary": {"min": 90000, "max": 130000, "currency": "USD"}
        }
    ]
    for job in job_data:
        authorized_client.post("/api/v1/jobs/", json=job)
    
    # Filter remote jobs
    response = authorized_client.get("/api/v1/jobs/filter?location=Remote")
    data = response.json()
    assert len(data["items"]) > 0
    for job in data["items"]:
        assert job["location"].lower() == "remote"
    
    # Filter contract jobs
    response = authorized_client.get("/api/v1/jobs/filter?type=contract")
    data = response.json()
    assert len(data["items"]) > 0
    for job in data["items"]:
        assert job["type"] == "contract"

def test_get_job_matches_success(authorized_client: TestClient, test_job: dict, test_resume: dict):
    """Test successful job matches retrieval"""
    response = authorized_client.get(f"/api/v1/jobs/{test_job['id']}/matches")
    data = assert_success_response(response)
    assert "matches" in data
    assert isinstance(data["matches"], list)
    if data["matches"]:  # If there are any matches
        match = data["matches"][0]
        assert "resume_id" in match
        assert "score" in match
        assert "created_at" in match

def test_analyze_job_success(authorized_client: TestClient, test_job: dict):
    """Test successful job analysis"""
    response = authorized_client.post(f"/api/v1/jobs/{test_job['id']}/analyze")
    data = assert_success_response(response, 202)
    assert "analysis_id" in data
    assert "status" in data
    assert data["status"] == "processing"

def test_get_job_stats_success(authorized_client: TestClient, test_job: dict):
    """Test successful job statistics retrieval"""
    response = authorized_client.get(f"/api/v1/jobs/{test_job['id']}/stats")
    data = assert_success_response(response)
    assert "total_matches" in data
    assert "average_score" in data
    assert "top_skills" in data
    assert "experience_distribution" in data
    assert isinstance(data["total_matches"], int)
    assert isinstance(data["average_score"], float)
    assert isinstance(data["top_skills"], list)
    assert isinstance(data["experience_distribution"], dict) 