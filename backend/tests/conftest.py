import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import asyncio
from unittest.mock import MagicMock, patch
import spacy
from app.core.config import Settings

from app.main import app
from app.db.base import Base
from app.db.base import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.common import ErrorCodes

# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Test settings
class TestSettings(Settings):
    """Test settings with mock services."""
    TESTING: bool = True
    REDIS_URL: str = "redis://localhost:6379/1"
    DATABASE_URL: str = "sqlite:///:memory:"
    SPACY_MODEL: str = "en_core_web_sm"
    
    class Config:
        env_file = ".env.test"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
def test_settings():
    """Get test settings."""
    return TestSettings()

@pytest.fixture(scope="session")
def mock_spacy():
    """Create a mock spaCy model."""
    nlp_mock = MagicMock()
    
    # Mock spaCy methods
    nlp_mock.return_value = nlp_mock
    nlp_mock.similarity.return_value = 0.8
    nlp_mock.ents = []
    
    # Mock doc
    doc_mock = MagicMock()
    doc_mock.similarity.return_value = 0.8
    doc_mock.ents = []
    nlp_mock.return_value = doc_mock
    
    # Patch spacy.load
    with patch('spacy.load', return_value=nlp_mock):
        yield nlp_mock

@pytest.fixture(scope="session")
def mock_redis():
    """Create a mock Redis client."""
    redis_mock = MagicMock()
    
    # Mock Redis methods
    redis_mock.get.return_value = None
    redis_mock.set.return_value = True
    redis_mock.delete.return_value = 1
    redis_mock.exists.return_value = 0
    redis_mock.keys.return_value = []
    redis_mock.publish.return_value = 1
    
    # Mock pubsub
    pubsub_mock = MagicMock()
    pubsub_mock.subscribe.return_value = None
    pubsub_mock.get_message.return_value = None
    redis_mock.pubsub.return_value = pubsub_mock
    
    # Patch redis.asyncio.Redis
    with patch('redis.asyncio.Redis.from_url', return_value=redis_mock):
        yield redis_mock

@pytest.fixture(scope="session")
def mock_websocket():
    """Create a mock WebSocket client."""
    ws_mock = MagicMock()
    
    # Mock WebSocket methods
    ws_mock.accept = MagicMock()
    ws_mock.send_json = MagicMock()
    ws_mock.close = MagicMock()
    ws_mock.client_state = "CONNECTED"
    
    return ws_mock

@pytest.fixture(scope="session")
def test_env():
    """Set test environment variables."""
    import os
    
    env = {
        "TESTING": "true",
        "REDIS_URL": "redis://localhost:6379/1",
        "DATABASE_URL": "sqlite:///:memory:",
        "SPACY_MODEL": "en_core_web_sm",
        "SECRET_KEY": "test-secret-key",
        "ALGORITHM": "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    }
    
    # Save original env
    original_env = dict(os.environ)
    
    # Update env
    os.environ.update(env)
    
    yield env
    
    # Restore original env
    os.environ.clear()
    os.environ.update(original_env)

@pytest.fixture(autouse=True)
async def setup_test_env(test_env, mock_redis, mock_spacy):
    """Set up test environment for each test."""
    # Clear Redis
    await mock_redis.flushdb()
    
    # Reset spaCy mock
    mock_spacy.reset_mock()
    
    yield
    
    # Clean up
    await mock_redis.flushdb()
    mock_spacy.reset_mock()

@pytest.fixture(scope="session")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with a fresh database"""
    def override_get_db():
        try:
            yield db
        finally:
            db.rollback()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="module")
def test_user(db: Session) -> Dict[str, Any]:
    """Create a test user"""
    user = User(
        email="test@example.com",
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password"
        full_name="Test User",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "access_token": create_access_token(user.id),
    }

@pytest.fixture(scope="module")
def test_resume(db: Session, test_user: Dict[str, Any]) -> Dict[str, Any]:
    """Create a test resume"""
    resume = Resume(
        title="Test Resume",
        content="Test resume content with Python and FastAPI experience",
        user_id=test_user["id"],
        skills=["python", "fastapi", "sql"],
        experience=2,
        education=["Bachelor's in Computer Science"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {
        "id": str(resume.id),
        "title": resume.title,
        "content": resume.content,
        "user_id": resume.user_id,
        "skills": resume.skills,
        "experience": resume.experience,
        "education": resume.education,
    }

@pytest.fixture(scope="module")
def test_job(db: Session) -> Dict[str, Any]:
    """Create a test job posting"""
    job = Job(
        title="Senior Python Developer",
        company="Test Company",
        description="Looking for a Python developer with FastAPI experience",
        requirements=["python", "fastapi", "sql", "docker"],
        location="Remote",
        type="full_time",
        salary={"min": 100000, "max": 150000, "currency": "USD"},
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {
        "id": str(job.id),
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "requirements": job.requirements,
        "location": job.location,
        "type": job.type,
        "salary": job.salary,
    }

@pytest.fixture(scope="module")
def authorized_client(client: TestClient, test_user: Dict[str, Any]) -> TestClient:
    """Create an authorized test client"""
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {test_user['access_token']}",
        "X-Request-ID": "test-request-id",
    }
    return client

# Common test assertions
def assert_error_response(response: Any, status_code: int, error_code: str) -> None:
    """Assert error response format and content"""
    assert response.status_code == status_code
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == error_code
    assert "message" in data["error"]
    assert "timestamp" in data

def assert_success_response(response: Dict[str, Any]) -> None:
    """Assert that a response has a success status and contains data."""
    assert response.get("status") == "success"
    assert "data" in response

def assert_paginated_response(response: Any, expected_count: int) -> None:
    """Assert paginated response format and content"""
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == expected_count
    assert "total" in data["pagination"]
    assert "page" in data["pagination"]
    assert "size" in data["pagination"]
    assert "pages" in data["pagination"]

# Test data generators
def generate_test_resume() -> Dict[str, Any]:
    """Generate test resume data"""
    return {
        "title": "Test Resume",
        "content": "Experienced Python developer with FastAPI and SQL skills.",
        "skills": ["python", "fastapi", "sql", "docker"],
        "experience": 3,
        "education": ["Bachelor's in Computer Science"],
    }

def generate_test_job() -> Dict[str, Any]:
    """Generate test job data"""
    return {
        "title": "Python Developer",
        "company": "Test Company",
        "description": "Looking for a Python developer with FastAPI experience.",
        "requirements": ["python", "fastapi", "sql", "docker"],
        "location": "Remote",
        "type": "full_time",
        "salary": {"min": 80000, "max": 120000, "currency": "USD"},
    }

@pytest.fixture(autouse=True)
def mock_huggingface_pipeline(monkeypatch):
    """Mock the Hugging Face pipeline so that tests run without internet."""
    mock_pipeline = MagicMock()
    mock_pipeline.return_value = [{"label": "POSITIVE", "score": 0.9}]
    monkeypatch.setattr("transformers.pipeline", mock_pipeline)
    yield mock_pipeline

@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    with patch("redis.asyncio.Redis") as mock:
        mock.return_value = MagicMock()
        yield mock.return_value

@pytest.fixture
def mock_db():
    """Mock database session for testing."""
    with patch("sqlalchemy.orm.Session") as mock:
        mock.return_value = MagicMock()
        yield mock.return_value 