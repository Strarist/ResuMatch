import pytest
from fastapi.testclient import TestClient
import tempfile
import os

def test_simple_resume_upload(client: TestClient, test_user):
    """Test simple resume upload without complex mocking"""
    
    # Create a temporary test file
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
        temp_file.write(b"Test resume content with Python and FastAPI skills")
        temp_file_path = temp_file.name
    
    try:
        # Test file upload
        with open(temp_file_path, 'rb') as f:
            response = client.post(
                "/api/v1/resumes/upload",
                files={"file": ("test_resume.txt", f, "text/plain")},
                headers={"Authorization": f"Bearer {test_user.access_token}"}
            )
        
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.json()}")
        
        # Should return 200 for successful upload
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "processing"
        assert "message" in data
        
    finally:
        # Cleanup
        try:
            os.unlink(temp_file_path)
        except:
            pass

def test_resume_upload_unauthorized(client: TestClient):
    """Test resume upload without authentication"""
    
    # Create a temporary test file
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
        temp_file.write(b"Test resume content")
        temp_file_path = temp_file.name
    
    try:
        # Test file upload without auth
        with open(temp_file_path, 'rb') as f:
            response = client.post(
                "/api/v1/resumes/upload",
                files={"file": ("test_resume.txt", f, "text/plain")}
            )
        
        # Should return 403 for unauthorized
        assert response.status_code == 403
        
    finally:
        # Cleanup
        try:
            os.unlink(temp_file_path)
        except:
            pass 