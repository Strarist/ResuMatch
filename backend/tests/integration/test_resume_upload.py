import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import tempfile
import os

def test_resume_upload_flow(client: TestClient, test_user):
    """Test the complete resume upload flow"""
    
    # Mock the resume parser to avoid file processing issues
    with patch('app.api.v1.endpoints.resumes.parser') as mock_parser:
        mock_parser.parse_resume.return_value = {
            'skills': ['python', 'fastapi', 'sql'],
            'experience': [{'title': 'Software Engineer', 'duration': '2020-2023'}],
            'education': ['Bachelor of Science in Computer Science'],
            'summary': 'Experienced software engineer with 3 years of experience.'
        }
        
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
            temp_file.write(b"Test resume content")
            temp_file_path = temp_file.name
        
        try:
            # Test file upload
            with open(temp_file_path, 'rb') as f:
                response = client.post(
                    "/api/v1/resumes/upload",
                    files={"file": ("test_resume.txt", f, "text/plain")},
                    headers={"Authorization": f"Bearer {test_user.access_token}"}
                )
            
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert data["status"] == "processing"
            assert "message" in data
            
            resume_id = data["id"]
            
            # Test getting resume status
            response = client.get(
                f"/api/v1/resumes/{resume_id}",
                headers={"Authorization": f"Bearer {test_user.access_token}"}
            )
            
            # Should return 200 even if processing is not complete
            assert response.status_code == 200
            
        finally:
            # Cleanup
            try:
                os.unlink(temp_file_path)
            except:
                pass

def test_resume_upload_invalid_file(client: TestClient, test_user):
    """Test resume upload with invalid file type"""
    
    # Create a temporary test file with invalid extension
    with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as temp_file:
        temp_file.write(b"Invalid file content")
        temp_file_path = temp_file.name
    
    try:
        # Test file upload with invalid type
        with open(temp_file_path, 'rb') as f:
            response = client.post(
                "/api/v1/resumes/upload",
                files={"file": ("test_resume.exe", f, "application/octet-stream")},
                headers={"Authorization": f"Bearer {test_user.access_token}"}
            )
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        
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
        
        assert response.status_code == 403
        
    finally:
        # Cleanup
        try:
            os.unlink(temp_file_path)
        except:
            pass 