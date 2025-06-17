import pytest
from fastapi.testclient import TestClient
from app.schemas.common import ErrorCodes

def test_login_success(client: TestClient, test_user: dict):
    """Test successful login"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user["email"],
            "password": "password",
        },
    )
    data = response.json()
    assert response.status_code == 200
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert "timestamp" in data

def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "wrong@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.AUTH_INVALID_CREDENTIALS

def test_register_success(client: TestClient):
    """Test successful user registration"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User",
        },
    )
    data = response.json()
    assert response.status_code == 200
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert "timestamp" in data

def test_register_existing_email(client: TestClient, test_user: dict):
    """Test registration with existing email"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user["email"],
            "password": "newpassword123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.VALIDATION_ERROR

def test_register_invalid_email(client: TestClient):
    """Test registration with invalid email format"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "invalid-email",
            "password": "newpassword123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.VALIDATION_ERROR

def test_register_weak_password(client: TestClient):
    """Test registration with weak password"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "123",  # Too short
            "full_name": "New User",
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.VALIDATION_ERROR

def test_get_current_user_unauthorized(client: TestClient):
    """Test getting current user without authentication"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.AUTH_REQUIRED

def test_get_current_user_success(authorized_client: TestClient, test_user: dict):
    """Test getting current user with valid authentication"""
    response = authorized_client.get("/api/v1/auth/me")
    data = response.json()
    assert response.status_code == 200
    assert data["data"]["email"] == test_user["email"]
    assert data["data"]["full_name"] == test_user["full_name"]
    assert "timestamp" in data

def test_invalid_token(client: TestClient):
    """Test authentication with invalid token"""
    client.headers["Authorization"] = "Bearer invalid-token"
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.AUTH_INVALID_TOKEN

def test_expired_token(client: TestClient, test_user: dict):
    """Test authentication with expired token"""
    # Create an expired token
    from app.core.security import create_access_token
    from datetime import timedelta
    expired_token = create_access_token(
        test_user["id"],
        expires_delta=timedelta(microseconds=1)
    )
    client.headers["Authorization"] = f"Bearer {expired_token}"
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.AUTH_TOKEN_EXPIRED

def test_rate_limiting(client: TestClient):
    """Test rate limiting on login endpoint"""
    # Make multiple requests in quick succession
    for _ in range(settings.RATE_LIMIT_BURST_SIZE + 1):
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "test@example.com",
                "password": "wrongpassword",
            },
        )
    
    # The last request should be rate limited
    assert response.status_code == 429
    data = response.json()
    assert data["error"]["code"] == ErrorCodes.RATE_LIMIT_EXCEEDED
    assert "Retry-After" in response.headers 