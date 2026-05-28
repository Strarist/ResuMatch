"""Adaptive roadmap intelligence API."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.roadmap_intel import (
    get_or_create_roadmap, mutate_existing_roadmap, complete_node, defer_node, RoadmapRepository,
)

router = APIRouter(prefix="/v1/roadmap-intel", tags=["Roadmap Intelligence"])


class CreateRoadmapRequest(BaseModel):
    target_role: str = Field(min_length=2)
    target_skills: list[str] = Field(min_length=1)


class MutateRequest(BaseModel):
    target_skills: list[str] = Field(min_length=1)


class NodeActionRequest(BaseModel):
    skill: str


@router.get("/state")
async def get_roadmap_state(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = RoadmapRepository(db)
    state = await repo.get_active(current_user.id)
    if not state:
        return {"state": None}
    return {
        "state": {
            "id": state.id,
            "target_role": state.target_role,
            "version": state.roadmap_version,
            "snapshot": state.roadmap_snapshot,
            "completed_nodes": state.completed_nodes,
            "deferred_nodes": state.deferred_nodes,
            "active_focus_areas": state.active_focus_areas,
            "learning_velocity": state.learning_velocity,
            "last_generated_at": state.last_generated_at,
        }
    }


@router.post("/create")
async def create_roadmap(
    body: CreateRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    state = await get_or_create_roadmap(db, current_user.id, body.target_role, body.target_skills)
    await db.commit()
    return {
        "state": {
            "id": state.id,
            "target_role": state.target_role,
            "version": state.roadmap_version,
            "snapshot": state.roadmap_snapshot,
            "active_focus_areas": state.active_focus_areas,
        }
    }


@router.post("/mutate")
async def mutate_roadmap_endpoint(
    body: MutateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await mutate_existing_roadmap(db, current_user.id, body.target_skills)
    if not result:
        return {"mutations": [], "message": "No active roadmap found"}
    await db.commit()
    return {
        "mutations": result["mutations"],
        "new_focus_areas": result["new_focus_areas"],
        "snapshot": result["snapshot"],
    }


@router.get("/timeline")
async def get_roadmap_timeline(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = RoadmapRepository(db)
    events = await repo.get_timeline(current_user.id)
    return {
        "events": [
            {"id": e.id, "event_type": e.event_type, "payload": e.structured_payload, "created_at": e.created_at}
            for e in events
        ]
    }


@router.post("/node/complete")
async def mark_node_complete(
    body: NodeActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.user_progress_service import track_milestone_completion
    await complete_node(db, current_user.id, body.skill)
    await track_milestone_completion(db, current_user.id, body.skill)
    await db.commit()
    return {"message": f"Node '{body.skill}' marked complete"}


@router.post("/node/defer")
async def mark_node_deferred(
    body: NodeActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await defer_node(db, current_user.id, body.skill)
    await db.commit()
    return {"message": f"Node '{body.skill}' deferred"}
