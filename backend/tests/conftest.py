import pytest
import asyncio
from typing import Generator, Dict, Any
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import spacy
from app.core.config import Settings

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.schemas.common import ErrorCodes

# Import all models to ensure they are registered with SQLAlchemy
from app.models import User, Resume, Job

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestSettings(Settings):
    """Test settings with mock services."""
    TESTING: bool = True
    REDIS_URL: str = "redis://localhost:6379/1"
    DATABASE_URL: str = SQLALCHEMY_DATABASE_URL
    SQLALCHEMY_DATABASE_URI: str = SQLALCHEMY_DATABASE_URL
    SPACY_MODEL: str = "en_core_web_sm"
    SECRET_KEY: str = "test-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

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
    """Test settings fixture."""
    return TestSettings()

@pytest.fixture(scope="session")
def mock_spacy():
    """Mock spaCy NLP model."""
    mock_nlp = MagicMock()
    mock_nlp.return_value = MagicMock()
    return mock_nlp

@pytest.fixture(scope="session")
def mock_redis():
    """Mock Redis for session scope."""
    mock_redis = MagicMock()
    mock_redis.get = MagicMock(return_value=None)
    mock_redis.set = MagicMock(return_value=True)
    mock_redis.delete = MagicMock(return_value=True)
    mock_redis.exists = MagicMock(return_value=False)
    mock_redis.flushdb = MagicMock()
    return mock_redis

@pytest.fixture(scope="session")
def mock_websocket():
    """Mock WebSocket for session scope."""
    mock_ws = MagicMock()
    mock_ws.send_json = AsyncMock()
    mock_ws.send_text = AsyncMock()
    mock_ws.close = AsyncMock()
    return mock_ws

@pytest.fixture(scope="session")
def test_env():
    """Test environment setup."""
    # Set test environment variables
    import os
    os.environ["TESTING"] = "true"
    os.environ["DATABASE_URL"] = SQLALCHEMY_DATABASE_URL
    os.environ["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URL
    os.environ["REDIS_URL"] = "redis://localhost:6379/1"
    os.environ["SECRET_KEY"] = "test-secret-key"
    os.environ["ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    return True

@pytest.fixture(autouse=True)
async def setup_test_env(test_env, mock_redis, mock_spacy):
    """Setup test environment before each test."""
    # Mock external dependencies
    import app.core.cache
    app.core.cache.redis = mock_redis
    
    # Mock spaCy
    with pytest.MonkeyPatch().context() as m:
        m.setattr("spacy.load", mock_spacy)
        yield
    
    # Clean up
    mock_redis.flushdb()
    mock_spacy.reset_mock()

@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Database session fixture with proper cleanup."""
    # Drop all tables and recreate for each test
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Clean up after each test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db: Session) -> TestClient:
    """Test client fixture with database override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    # Override the database dependency
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

@pytest.fixture
def test_user(db: Session) -> User:
    """Test user fixture."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_resume(db: Session, test_user: User) -> Resume:
    """Test resume fixture."""
    resume = Resume(
        user_id=test_user.id,
        title="Test Resume",
        content="Experienced software engineer with Python skills",
        skills="Python, FastAPI, React",
        experience="5 years of software development",
        education="Bachelor's in Computer Science",
        file_path="/tmp/test_resume.pdf"
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume

@pytest.fixture
def test_job(db: Session, test_user: User) -> Job:
    """Test job fixture."""
    job = Job(
        user_id=test_user.id,
        title="Software Engineer",
        company="Tech Corp",
        description="Looking for a Python developer with FastAPI experience",
        requirements="Python, FastAPI, SQL",
        location="San Francisco, CA",
        salary_min=80000,
        salary_max=120000,
        job_type="full-time",
        experience_level="mid"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@pytest.fixture
def authorized_client(client: TestClient, test_user: User) -> TestClient:
    """Authorized test client fixture."""
    access_token = create_access_token(test_user.id)
    client.headers["Authorization"] = f"Bearer {access_token}"
    return client

@pytest.fixture
def test_user_data() -> Dict[str, Any]:
    """Test user data fixture."""
    return {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "full_name": "New User"
    }

@pytest.fixture
def test_resume_data() -> Dict[str, Any]:
    """Test resume data fixture."""
    return {
        "title": "Software Engineer Resume",
        "content": "Experienced software engineer with 5 years of experience",
        "skills": ["Python", "FastAPI", "React"],
        "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
        "education": ["Bachelor's in Computer Science"]
    }

@pytest.fixture
def test_job_data() -> Dict[str, Any]:
    """Test job data fixture."""
    return {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "description": "Looking for an experienced Python developer",
        "requirements": "Python, FastAPI, SQL, Docker",
        "location": "San Francisco, CA",
        "salary_min": 100000,
        "salary_max": 150000,
        "job_type": "full-time",
        "experience_level": "senior"
    }

# Mock fixtures for external services
@pytest.fixture
def mock_redis_service(monkeypatch):
    """Mock Redis service fixture."""
    mock_redis = MagicMock()
    mock_redis.get = MagicMock(return_value=None)
    mock_redis.set = MagicMock(return_value=True)
    mock_redis.delete = MagicMock(return_value=True)
    mock_redis.exists = MagicMock(return_value=False)
    mock_redis.flushdb = MagicMock()
    mock_redis.publish = MagicMock()
    mock_redis.subscribe = MagicMock()
    mock_redis.get_message = MagicMock(return_value=None)
    
    # Mock async methods
    mock_redis.get_async = AsyncMock(return_value=None)
    mock_redis.set_async = AsyncMock(return_value=True)
    mock_redis.delete_async = AsyncMock(return_value=True)
    
    return mock_redis

@pytest.fixture
def mock_websocket_manager(monkeypatch):
    """Mock WebSocket manager fixture."""
    mock_manager = MagicMock()
    mock_manager.connect = AsyncMock()
    mock_manager.disconnect = AsyncMock()
    mock_manager.send_message = AsyncMock()
    mock_manager.broadcast = AsyncMock()
    mock_manager.active_connections = {}
    return mock_manager

@pytest.fixture
def mock_resume_parser(monkeypatch):
    """Mock resume parser fixture."""
    mock_parser = MagicMock()
    mock_parser.parse_resume = AsyncMock(return_value={
        "skills": ["Python", "FastAPI"],
        "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
        "education": ["Bachelor's in Computer Science"],
        "contact_info": {"email": "test@example.com"},
        "summary": "Experienced software engineer"
    })
    mock_parser.parse_file = AsyncMock(return_value={
        "content": "Test resume content",
        "skills": ["Python", "FastAPI"],
        "experience": [{"title": "Software Engineer", "company": "Tech Corp"}]
    })
    return mock_parser

@pytest.fixture
def mock_resume_matcher(monkeypatch):
    """Mock resume matcher fixture."""
    mock_matcher = MagicMock()
    mock_matcher.extract_skills = AsyncMock(return_value=["Python", "FastAPI"])
    mock_matcher.calculate_semantic_similarity = MagicMock(return_value=0.8)
    mock_matcher.match_resume_to_job = MagicMock(return_value={
        "score": 0.85,
        "skills_match": 0.9,
        "experience_match": 0.8
    })
    return mock_matcher

# Test utilities
def assert_error_response(response: Any, status_code: int, error_code: str) -> None:
    """Assert error response structure."""
    assert response.status_code == status_code
    data = response.json()
    assert "detail" in data
    if error_code:
        assert error_code in str(data["detail"])

def assert_success_response(response: Dict[str, Any]) -> None:
    """Assert success response structure."""
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)

def assert_paginated_response(response: Any, expected_count: int) -> None:
    """Assert paginated response structure."""
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) == expected_count

def generate_test_resume() -> Dict[str, Any]:
    """Generate test resume data."""
    return {
        "title": "Software Engineer Resume",
        "content": "Experienced software engineer with Python and FastAPI skills",
        "skills": ["Python", "FastAPI", "React", "Docker"],
        "experience": [
            {"title": "Senior Software Engineer", "company": "Tech Corp", "years": 3},
            {"title": "Software Engineer", "company": "Startup Inc", "years": 2}
        ],
        "education": ["Bachelor's in Computer Science"]
    }

def generate_test_job() -> Dict[str, Any]:
    """Generate test job data."""
    return {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "description": "Looking for an experienced Python developer with FastAPI experience",
        "requirements": "Python, FastAPI, SQL, Docker, React",
        "location": "San Francisco, CA",
        "salary_min": 100000,
        "salary_max": 150000,
        "job_type": "full-time",
        "experience_level": "senior"
    }

@pytest.fixture(autouse=True)
def mock_huggingface_pipeline(monkeypatch):
    """Mock HuggingFace pipeline for all tests."""
    mock_pipeline = MagicMock()
    mock_pipeline.return_value = MagicMock()
    monkeypatch.setattr("transformers.pipeline", mock_pipeline)
    return mock_pipeline

@pytest.fixture
def mock_db():
    """Mock database session."""
    mock_session = MagicMock()
    mock_session.query = MagicMock()
    mock_session.add = MagicMock()
    mock_session.commit = MagicMock()
    mock_session.refresh = MagicMock()
    mock_session.close = MagicMock()
    return mock_session 