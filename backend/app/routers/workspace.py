"""Workspace API — sessions, copilot messages, recommendation actions."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.workspace import WorkspaceRepository, generate_copilot_response
from app.services.intelligence.orchestrator import run_intelligence_cycle

router = APIRouter(prefix="/v1/workspace", tags=["Workspace"])


class CreateSessionRequest(BaseModel):
    title: str = "New Session"
    session_type: str = "copilot"


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1)


class RecommendationActionRequest(BaseModel):
    recommendation_type: str
    recommendation_title: str
    action: str  # accept, defer, dismiss, add_to_roadmap


# === Sessions ===

@router.get("/sessions")
async def list_sessions(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WorkspaceRepository(db)
    sessions = await repo.list_sessions(current_user.id)
    return {"sessions": [{"id": s.id, "title": s.title, "type": s.session_type, "updated_at": s.updated_at} for s in sessions]}


@router.post("/session")
async def create_session(body: CreateSessionRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WorkspaceRepository(db)
    session = await repo.create_session(current_user.id, body.title, body.session_type)
    await db.commit()
    return {"id": session.id, "title": session.title, "type": session.session_type}


@router.get("/session/{session_id}")
async def get_session(session_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WorkspaceRepository(db)
    session = await repo.get_session(session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = await repo.get_messages(session_id)
    return {
        "session": {"id": session.id, "title": session.title, "type": session.session_type},
        "messages": [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in messages],
    }


# === Copilot Messages ===

@router.post("/session/{session_id}/message")
async def send_message(session_id: str, body: SendMessageRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WorkspaceRepository(db)
    session = await repo.get_session(session_id, current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message
    await repo.add_message(session_id, "user", body.content)

    # Get intelligence context
    intel = await run_intelligence_cycle(db, current_user.id)
    summary = intel["summary"]
    recommendations = intel["recommendations"]

    # Generate copilot response asynchronously via OpenRouter LLM
    response = await generate_copilot_response(db, session_id, body.content, summary, recommendations)

    # Save assistant message with context
    msg = await repo.add_message(session_id, "assistant", response, {"dominant_path": summary.get("dominant_path")})
    await db.commit()

    return {"message": {"id": msg.id, "role": "assistant", "content": response, "created_at": msg.created_at}}


# === Recommendation Actions ===

@router.post("/recommendations/action")
async def record_recommendation_action(body: RecommendationActionRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WorkspaceRepository(db)
    action = await repo.record_action(current_user.id, body.recommendation_type, body.recommendation_title, body.action)

    # If action is add_to_roadmap, trigger roadmap mutation
    if body.action == "add_to_roadmap":
        from app.services.roadmap_intel import complete_node
        # Adding to roadmap means it becomes a target — handled by next mutation cycle

    await db.commit()
    return {"message": f"Action '{body.action}' recorded for '{body.recommendation_title}'", "id": action.id}


@router.get("/recommendations/actions")
async def get_recommendation_actions(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = WorkspaceRepository(db)
    actions = await repo.get_actions(current_user.id)
    return {"actions": [{"id": a.id, "type": a.recommendation_type, "title": a.recommendation_title, "action": a.action, "created_at": a.created_at} for a in actions]}
