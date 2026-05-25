"""Matches router — HTTP concerns only."""

from fastapi import APIRouter, Depends
from fastapi_limiter.depends import RateLimiter

from app.dependencies import get_current_user, get_match_repo
from app.models import User
from app.repositories import MatchRepository

router = APIRouter(prefix="/v1/matches", tags=["Matches"])


@router.get("", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def list_matches(
    current_user: User = Depends(get_current_user),
    match_repo: MatchRepository = Depends(get_match_repo),
):
    matches = await match_repo.list_by_user(current_user.id)
    return {
        "matches": [
            {
                "id": m.id,
                "resume_filename": m.resume.filename,
                "job_title": m.job.title,
                "score": m.score,
                "created_at": m.created_at,
            }
            for m in matches
        ]
    }
