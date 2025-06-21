import pytest
from fastapi.testclient import TestClient
from app.schemas.common import ErrorCodes
from app.core.config import settings

def test_login_success(client: TestClient, test_user) -> None:
    """Test successful login"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_user.email,
            "password": "testpassword123",
        },
    )
    data = response.json()
    assert response.status_code == 200
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client: TestClient) -> None:
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
    assert "error" in data
    assert data["error"]["code"] == 401

def test_register_success(client: TestClient) -> None:
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
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_register_existing_email(client: TestClient, test_user) -> None:
    """Test registration with existing email"""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "newpassword123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert "error" in data

def test_register_invalid_email(client: TestClient) -> None:
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
    assert "detail" in data

def test_register_weak_password(client: TestClient) -> None:
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
    assert "detail" in data

def test_get_current_user_unauthorized(client: TestClient) -> None:
    """Test getting current user without authentication"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403
    data = response.json()
    assert "error" in data

def test_get_current_user_success(authorized_client: TestClient, test_user) -> None:
    """Test getting current user with valid authentication"""
    response = authorized_client.get("/api/v1/auth/me")
    data = response.json()
    assert response.status_code == 200
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name

def test_invalid_token(client: TestClient) -> None:
    """Test authentication with invalid token"""
    client.headers["Authorization"] = "Bearer invalid-token"
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data

def test_expired_token(client: TestClient, test_user) -> None:
    """Test authentication with expired token"""
    # Create an expired token
    from app.core.security import create_access_token
    from datetime import timedelta
    expired_token = create_access_token(
        test_user.id,
        expires_delta=timedelta(seconds=-1)  # Negative delta ensures expiration
    )
    client.headers["Authorization"] = f"Bearer {expired_token}"
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert "error" in data 