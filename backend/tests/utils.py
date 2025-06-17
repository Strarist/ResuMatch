import asyncio
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Coroutine, Union, Iterable
from unittest.mock import MagicMock

import pytest
from fastapi import WebSocket
from redis.asyncio import Redis
from fastapi.websockets import WebSocketState

from app.schemas.matching import (
    Education, Skill, Experience, MatchResult,
    DegreeLevel, SkillCategory, ExperienceLevel,
    EducationMatch, SkillMatch, ExperienceMatch, RoleMatch, MatchDimension
)

class MockWebSocket:
    """Mock WebSocket for testing."""
    def __init__(self) -> None:
        self.messages: List[Dict[str, Any]] = []
        self.client_state = WebSocketState.CONNECTED
        self._closed = False
    
    async def accept(self, subprotocol: Optional[str] = None, headers: Optional[Iterable[tuple[bytes, bytes]]] = None) -> None:
        """Accept the connection."""
        pass
    
    async def send_json(self, data: Dict[str, Any], mode: str = "text") -> None:
        """Send JSON data."""
        self.messages.append(data)
    
    async def receive_json(self, mode: str = "text") -> Dict[str, Any]:
        """Receive JSON data."""
        if not self.messages:
            raise Exception("No messages available")
        return self.messages.pop(0)
    
    async def close(self, code: int = 1000, reason: Optional[str] = None) -> None:
        """Close the connection."""
        self._closed = True
        self.client_state = WebSocketState.DISCONNECTED

class MockRedis:
    """Mock Redis client for testing."""
    def __init__(self) -> None:
        self._data: Dict[str, Any] = {}
        self._pubsub: Dict[str, List[Dict[str, Any]]] = {}
    
    async def get(self, name: Union[bytes, str, memoryview]) -> Optional[str]:
        """Get value from cache."""
        if isinstance(name, bytes):
            name = name.decode('utf-8')
        elif isinstance(name, memoryview):
            name = name.tobytes().decode('utf-8')
        return self._data.get(name)
    
    async def set(
        self,
        name: Union[bytes, str, memoryview],
        value: Union[bytes, memoryview, str, int, float],
        ex: Optional[Union[int, timedelta]] = None,
        px: Optional[Union[int, timedelta]] = None,
        nx: bool = False,
        xx: bool = False,
        keepttl: bool = False,
        get: bool = False,
        exat: Optional[Union[int, datetime]] = None,
        pxat: Optional[Union[int, datetime]] = None
    ) -> bool:
        """Set value in cache."""
        if isinstance(name, bytes):
            name = name.decode('utf-8')
        elif isinstance(name, memoryview):
            name = name.tobytes().decode('utf-8')
            
        if isinstance(value, bytes):
            value = value.decode('utf-8')
        elif isinstance(value, memoryview):
            value = value.tobytes().decode('utf-8')
            
        if nx and name in self._data:
            return False
        if xx and name not in self._data:
            return False
        
        self._data[name] = value
        if ex:
            asyncio.create_task(self._expire(name, ex if isinstance(ex, int) else int(ex.total_seconds())))
        return True
    
    async def delete(self, *names: Union[bytes, str, memoryview]) -> int:
        """Delete keys from cache."""
        count = 0
        for name in names:
            if isinstance(name, bytes):
                name = name.decode('utf-8')
            elif isinstance(name, memoryview):
                name = name.tobytes().decode('utf-8')
            if name in self._data:
                del self._data[name]
                count += 1
        return count
    
    async def exists(self, *names: Union[bytes, str, memoryview]) -> int:
        """Check if keys exist."""
        count = 0
        for name in names:
            if isinstance(name, bytes):
                name = name.decode('utf-8')
            elif isinstance(name, memoryview):
                name = name.tobytes().decode('utf-8')
            if name in self._data:
                count += 1
        return count
    
    async def keys(self, pattern: Union[bytes, str, memoryview] = "*", **kwargs: Any) -> List[str]:
        """Get keys matching pattern."""
        import fnmatch
        if isinstance(pattern, bytes):
            pattern = pattern.decode('utf-8')
        elif isinstance(pattern, memoryview):
            pattern = pattern.tobytes().decode('utf-8')
        return [k for k in self._data.keys() if fnmatch.fnmatch(k, pattern)]
    
    async def publish(self, channel: Union[bytes, str, memoryview], message: Union[bytes, memoryview, str, int, float], **kwargs: Any) -> int:
        """Publish message to channel."""
        if isinstance(channel, bytes):
            channel = channel.decode('utf-8')
        elif isinstance(channel, memoryview):
            channel = channel.tobytes().decode('utf-8')
            
        if isinstance(message, bytes):
            message = message.decode('utf-8')
        elif isinstance(message, memoryview):
            message = message.tobytes().decode('utf-8')
        elif isinstance(message, (int, float)):
            message = str(message)
            
        if channel not in self._pubsub:
            self._pubsub[channel] = []
        self._pubsub[channel].append({"type": "message", "data": message})
        return len(self._pubsub[channel])
    
    async def _expire(self, key: str, seconds: int) -> None:
        """Expire key after seconds."""
        await asyncio.sleep(seconds)
        if key in self._data:
            del self._data[key]

def create_test_resume() -> Dict[str, Any]:
    """Create a test resume."""
    return {
        'education': [
            Education(
                degree="Bachelor of Science in Computer Science",
                field="computer_science",
                institution="State University",
                level=DegreeLevel.BACHELORS,
                year=2020,
                gpa=3.5
            ),
            Education(
                degree="Master of Science in Data Science",
                field="data_science",
                institution="Tech University",
                level=DegreeLevel.MASTERS,
                year=2022,
                gpa=3.8
            )
        ],
        'skills': [
            Skill(
                name="Python",
                category=SkillCategory.TECHNICAL,
                level=0.9,
                years_experience=3.0,
                verified=True
            ),
            Skill(
                name="Machine Learning",
                category=SkillCategory.TECHNICAL,
                level=0.8,
                years_experience=2.0,
                verified=True
            ),
            Skill(
                name="Communication",
                category=SkillCategory.SOFT,
                level=0.7,
                verified=False
            )
        ],
        'experience': [
            Experience(
                title="Software Engineer",
                company="Tech Corp",
                start_date=datetime(2020, 6, 1),
                end_date=datetime(2022, 5, 31),
                description="Developed ML models and APIs",
                skills=["Python", "ML", "API"],
                level=ExperienceLevel.MID,
                is_current=False
            ),
            Experience(
                title="Senior Data Scientist",
                company="AI Solutions",
                start_date=datetime(2022, 6, 1),
                end_date=None,
                description="Leading ML projects",
                skills=["Python", "ML", "Leadership"],
                level=ExperienceLevel.SENIOR,
                is_current=True
            )
        ]
    }

def create_test_job() -> Dict[str, Any]:
    """Create a test job."""
    return {
        'title': "Senior Machine Learning Engineer",
        'company': "AI Innovations",
        'description': """
            We're looking for a Senior ML Engineer with:
            - 5+ years of Python and ML experience
            - MS/PhD in Computer Science or related field
            - Experience with deep learning frameworks
            - Strong communication skills
        """,
        'required_education': {
            'level': DegreeLevel.MASTERS,
            'field': "computer_science"
        },
        'required_skills': [
            Skill(
                name="Python",
                category=SkillCategory.TECHNICAL,
                level=0.8,
                required=True
            ),
            Skill(
                name="Machine Learning",
                category=SkillCategory.TECHNICAL,
                level=0.8,
                required=True
            ),
            Skill(
                name="Deep Learning",
                category=SkillCategory.TECHNICAL,
                level=0.7,
                required=True
            ),
            Skill(
                name="Communication",
                category=SkillCategory.SOFT,
                level=0.6,
                required=True
            )
        ],
        'required_experience': {
            'years': 5.0,
            'level': ExperienceLevel.SENIOR
        }
    }

def create_test_match_result(
    resume_id: str,
    job_id: str,
    education_match: EducationMatch,
    skill_match: SkillMatch,
    experience_match: ExperienceMatch
) -> MatchResult:
    """Create a test match result."""
    return MatchResult(
        overall_score=(
            education_match.match_score * 0.3 +
            skill_match.overall_score * 0.4 +
            experience_match.years_match * 0.3
        ),
        resume_id=resume_id,
        job_id=job_id,
        education_match=education_match,
        skill_match=skill_match,
        experience_match=experience_match,
        role_match=RoleMatch(
            title_similarity=0.8,
            level_match=1.0,
            required_level=ExperienceLevel.SENIOR,
            actual_level=ExperienceLevel.SENIOR,
            explanation="Good match for senior role"
        ),
        dimensions=[
            MatchDimension(
                name='Education',
                score=education_match.match_score,
                weight=0.3,
                description='Education match score'
            ),
            MatchDimension(
                name='Skills',
                score=skill_match.overall_score,
                weight=0.4,
                description='Skill match score'
            ),
            MatchDimension(
                name='Experience',
                score=experience_match.years_match,
                weight=0.3,
                description='Experience match score'
            )
        ]
    )

@pytest.fixture
def mock_websocket() -> MockWebSocket:
    """Create a mock WebSocket."""
    return MockWebSocket()

@pytest.fixture
def mock_redis() -> MockRedis:
    """Create a mock Redis client."""
    return MockRedis()

@pytest.fixture
def sample_resume() -> Dict[str, Any]:
    """Get a sample resume."""
    return create_test_resume()

@pytest.fixture
def sample_job() -> Dict[str, Any]:
    """Get a sample job."""
    return create_test_job()

@pytest.fixture
def sample_match_result(
    sample_resume: Dict[str, Any],
    sample_job: Dict[str, Any]
) -> MatchResult:
    """Get a sample match result."""
    education_match = EducationMatch(
        match_score=0.9,
        level_match=1.0,
        field_relevance=0.8
    )
    
    skill_match = SkillMatch(
        overall_score=0.85,
        matched_skills=[],
        missing_skills=[],
        category_scores={}
    )
    
    experience_match = ExperienceMatch(
        years_match=0.9,
        level_match=1.0,
        required_years=5.0,
        actual_years=4.5
    )
    
    return create_test_match_result(
        "test_resume_1",
        "test_job_1",
        education_match,
        skill_match,
        experience_match
    ) 