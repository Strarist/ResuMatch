import pytest
import asyncio
from datetime import datetime
from unittest.mock import patch
from app.schemas.matching import (
    Education, Skill, Experience, MatchResult, RoleMatch,
    DegreeLevel, SkillCategory, ExperienceLevel
)
from app.services.education_matcher import EducationMatcher
from app.services.role_matcher import RoleMatcher
from app.services.resume_matcher import ResumeMatcher
from app.core.cache_manager import CacheManager
from app.core.websocket import manager as ws_manager
from .utils import (
    mock_websocket, mock_redis, sample_resume, sample_job,
    sample_match_result, MockWebSocket, MockRedis
)
from redis.asyncio import Redis
from app.services.job import analyze_job, get_classifier
from app.services.resume import ResumeService
from app.schemas.resume import ResumeCreate
from app.schemas.job import JobCreate
from uuid import uuid4


# Service fixtures with mocks
@pytest.fixture
async def education_matcher(mock_spacy):
    with patch('app.services.education_matcher.spacy.load', return_value=mock_spacy):
        matcher = EducationMatcher()
        yield matcher


@pytest.fixture
async def role_matcher(mock_spacy):
    with patch('app.services.role_matcher.spacy.load', return_value=mock_spacy):
        matcher = RoleMatcher()
        yield matcher


@pytest.fixture
async def resume_matcher(mock_spacy):
    with patch('app.services.resume_matcher.spacy.load', return_value=mock_spacy):
        matcher = ResumeMatcher()
        yield matcher


@pytest.fixture
async def cache_manager(mock_redis):
    with patch('app.core.cache_manager.Redis.from_url', return_value=mock_redis):
        manager = CacheManager("redis://localhost:6379/1")
        yield manager


# Education matching tests
@pytest.mark.asyncio
async def test_education_matching(education_matcher, sample_resume, sample_job):
    match = await education_matcher.analyze_education_match(
        sample_resume['education'],
        sample_job['required_education']
    )

    assert match.match_score > 0.8
    assert match.level_match == 1.0
    assert match.field_relevance > 0.7
    assert len(match.suggestions) == 0

    lower_education = [
        Education(
            degree="Bachelor of Science",
            field="computer_science",
            institution="State University",
            level=DegreeLevel.BACHELORS,
            year=2020
        )
    ]

    match = await education_matcher.analyze_education_match(
        lower_education,
        sample_job['required_education']
    )

    assert match.match_score < 0.8
    assert match.level_match < 1.0
    assert len(match.suggestions) > 0


# Skill matching tests
@pytest.mark.asyncio
async def test_skill_matching(resume_matcher, sample_resume, sample_job):
    skill_match = await resume_matcher.calculate_skill_match(
        sample_resume['skills'],
        sample_job['required_skills']
    )
    assert skill_match.overall_score > 0.5


# Experience matching tests
@pytest.mark.asyncio
async def test_experience_matching(role_matcher, sample_resume, sample_job):
    match = await role_matcher.analyze_experience_match(
        sample_resume['experience'],
        sample_job['required_experience']
    )

    assert match.years_match > 0.8
    assert match.level_match == 1.0
    assert len(match.relevant_experience) > 0

    limited_experience = [
        Experience(
            title="Junior Developer",
            company="Startup",
            start_date=datetime(2022, 1, 1),
            end_date=None,
            level=ExperienceLevel.ENTRY,
            is_current=True
        )
    ]

    match = await role_matcher.analyze_experience_match(
        limited_experience,
        sample_job['required_experience']
    )

    assert match.years_match < 0.5
    assert match.level_match < 0.5
    assert len(match.suggestions) > 0


# Cache consistency tests
@pytest.mark.asyncio
async def test_cache_consistency(cache_manager, sample_resume, sample_job):
    resume_id = "test_resume_1"
    job_id = "test_job_1"

    await cache_manager.set_cached_value(
        f"resume:{resume_id}:embedding",
        [0.1, 0.2, 0.3],
        ttl=3600
    )

    await cache_manager.set_cached_value(
        f"job:{job_id}:embedding",
        [0.4, 0.5, 0.6],
        ttl=3600
    )

    await cache_manager.set_cached_value(
        f"match:{resume_id}:{job_id}:score",
        {"score": 0.85},
        ttl=3600
    )

    await cache_manager.invalidate_resume(resume_id, "update")

    assert await cache_manager.get_cached_value(f"resume:{resume_id}:embedding") is None
    assert await cache_manager.get_cached_value(f"match:{resume_id}:{job_id}:score") is None
    assert await cache_manager.get_cached_value(f"job:{job_id}:embedding") is not None


# WebSocket tests
@pytest.mark.asyncio
async def test_websocket_updates(mock_websocket, sample_match_result):
    resume_id = sample_match_result.resume_id

    await ws_manager.connect(mock_websocket, 'resume', resume_id)

    await ws_manager.send_match_update(sample_match_result)

    await asyncio.sleep(0.1)

    mock_websocket.send_json.assert_called_once()
    call_args = mock_websocket.send_json.call_args[0][0]
    assert call_args['type'] == 'match_update'
    assert call_args['payload']['resume_id'] == resume_id

    await ws_manager.disconnect(mock_websocket)
    assert mock_websocket not in ws_manager.active_connections['resume'][resume_id]


# Integration tests
@pytest.mark.asyncio
async def test_end_to_end_matching(
    education_matcher,
    role_matcher,
    resume_matcher,
    cache_manager,
    sample_resume,
    sample_job
):
    resume_id = "test_resume_3"
    job_id = "test_job_3"

    education_match = await education_matcher.analyze_education_match(
        sample_resume['education'],
        sample_job['required_education']
    )

    skill_match = await resume_matcher.calculate_skill_match(
        sample_resume['skills'],
        sample_job['required_skills']
    )

    experience_match = await role_matcher.analyze_experience_match(
        sample_resume['experience'],
        sample_job['required_experience']
    )

    match_result = MatchResult(
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
            required_level=sample_job['required_experience']['level'],
            actual_level=sample_resume['experience'][-1].level,
            explanation="Good match for senior role"
        ),
        dimensions=[
            {
                'name': 'Education',
                'score': education_match.match_score,
                'weight': 0.3,
                'description': 'Education match score'
            },
            {
                'name': 'Skills',
                'score': skill_match.overall_score,
                'weight': 0.4,
                'description': 'Skill match score'
            },
            {
                'name': 'Experience',
                'score': experience_match.years_match,
                'weight': 0.3,
                'description': 'Experience match score'
            }
        ]
    )

    await cache_manager.set_cached_value(
        f"match:{resume_id}:{job_id}:result",
        match_result.dict(),
        ttl=3600
    )

    cached_result = await cache_manager.get_cached_value(
        f"match:{resume_id}:{job_id}:result"
    )
    assert cached_result is not None
    assert cached_result['overall_score'] == match_result.overall_score

    await cache_manager.invalidate_resume(resume_id, "update")
    cached_result = await cache_manager.get_cached_value(
        f"match:{resume_id}:{job_id}:result"
    )
    assert cached_result is None


# Job analysis test
@pytest.mark.asyncio
async def test_job_analysis():
    result = await analyze_job("Looking for a Python developer with 5 years of experience.")
    assert result["sentiment"] in ["POSITIVE", "NEUTRAL"]
    assert 0 <= result["confidence"] <= 1


# Resume matching test
@pytest.mark.asyncio
async def test_resume_matching():
    resume_data = ResumeCreate(
        title="Senior Python Developer",
        content="Experienced Python developer with 5 years of experience.",
        skills=["Python", "FastAPI", "Docker"],
        experience=["Senior Developer at Tech Corp"],
        education=["BS in Computer Science"]
    )

    job_data = JobCreate(
        title="Python Developer",
        company="Tech Corp",
        description="Looking for a Python developer with 5 years of experience.",
        requirements=["Python", "FastAPI", "Docker"],
        location="Remote",
        type="full-time"
    )

    service = ResumeService()

    match_result = await service.match_resume(
        resume_id=uuid4(),
        job_id=uuid4()
    )

    assert isinstance(match_result, dict)
    assert "score" in match_result
    assert 0 <= match_result["score"] <= 1
