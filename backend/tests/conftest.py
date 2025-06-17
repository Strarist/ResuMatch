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
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.common import ErrorCodes

# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
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
    """Database session fixture"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db: Session) -> TestClient:
    """Test client fixture"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides = {}
    return TestClient(app)

@pytest.fixture
def test_user(db: Session) -> User:
    """Test user fixture"""
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
    """Test resume fixture"""
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
    """Test job fixture"""
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
    """Authorized test client fixture"""
    # Create access token
    access_token = create_access_token(test_user.id)
    client.headers["Authorization"] = f"Bearer {access_token}"
    return client

@pytest.fixture
def test_user_data() -> Dict[str, Any]:
    """Test user data fixture"""
    return {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "full_name": "New User"
    }

@pytest.fixture
def test_resume_data() -> Dict[str, Any]:
    """Test resume data fixture"""
    return {
        "title": "Software Engineer Resume",
        "content": "Experienced software engineer with 5 years of experience",
        "skills": ["Python", "FastAPI", "React"],
        "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
        "education": ["Bachelor's in Computer Science"]
    }

@pytest.fixture
def test_job_data() -> Dict[str, Any]:
    """Test job data fixture"""
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
def mock_redis(monkeypatch):
    """Mock Redis fixture"""
    class MockRedis:
        def __init__(self):
            self.data = {}
        
        def get(self, key):
            return self.data.get(key)
        
        def set(self, key, value, ex=None):
            self.data[key] = value
            return True
        
        def delete(self, key):
            if key in self.data:
                del self.data[key]
            return True
        
        def exists(self, key):
            return key in self.data
    
    mock_redis_instance = MockRedis()
    monkeypatch.setattr("app.core.cache.redis", mock_redis_instance)
    return mock_redis_instance

@pytest.fixture
def mock_websocket_manager(monkeypatch):
    """Mock WebSocket manager fixture"""
    class MockWebSocketManager:
        def __init__(self):
            self.connections = {}
        
        async def connect(self, websocket, user_id):
            self.connections[user_id] = websocket
        
        async def disconnect(self, websocket, user_id):
            if user_id in self.connections:
                del self.connections[user_id]
        
        async def send_message(self, user_id, message):
            if user_id in self.connections:
                await self.connections[user_id].send_text(str(message))
    
    mock_manager = MockWebSocketManager()
    monkeypatch.setattr("app.core.websocket.manager", mock_manager)
    return mock_manager

@pytest.fixture
def mock_resume_parser(monkeypatch):
    """Mock resume parser fixture"""
    class MockResumeParser:
        async def parse_resume(self, file_path):
            return {
                "skills": ["Python", "FastAPI"],
                "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
                "education": ["Bachelor's in Computer Science"],
                "contact_info": {"email": "test@example.com"},
                "summary": "Experienced software engineer"
            }
    
    mock_parser = MockResumeParser()
    monkeypatch.setattr("app.services.resume_parser.ResumeParser", lambda: mock_parser)
    return mock_parser

@pytest.fixture
def mock_resume_matcher(monkeypatch):
    """Mock resume matcher fixture"""
    class MockResumeMatcher:
        def extract_skills(self, text):
            return ["Python", "FastAPI"] if "python" in text.lower() else []
        
        def calculate_semantic_similarity(self, text1, text2):
            return 0.8
        
        def match_resume_to_job(self, resume, job):
            from app.schemas.matching import MatchResult, SkillMatch, ExperienceMatch, MatchStrategy
            return MatchResult(
                job_id=str(job.id),
                resume_id=str(resume.id),
                skill_match=SkillMatch(matched_skills=["Python"], missing_skills=[], match_percentage=0.8),
                experience_match=ExperienceMatch(role_similarity=0.8, experience_years=5, match_score=0.8),
                overall_score=0.8,
                strategy=MatchStrategy.AI_DRIVEN
            )
    
    mock_matcher = MockResumeMatcher()
    monkeypatch.setattr("app.services.resume_matcher.ResumeMatcher", lambda: mock_matcher)
    return mock_matcher

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
def mock_db():
    """Mock database session for testing."""
    with patch("sqlalchemy.orm.Session") as mock:
        mock.return_value = MagicMock()
        yield mock.return_value 