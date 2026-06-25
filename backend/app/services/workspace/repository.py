"""Workspace repository — session and message persistence."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.workspace.models import WorkspaceSession, WorkspaceMessage, RecommendationAction


class WorkspaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_sessions(self, user_id: str) -> list[WorkspaceSession]:
        result = await self.db.execute(
            select(WorkspaceSession)
            .where(WorkspaceSession.user_id == user_id)
            .order_by(WorkspaceSession.pinned.desc(), WorkspaceSession.updated_at.desc())
            .limit(20)
        )
        return list(result.scalars().all())

    async def create_session(self, user_id: str, title: str = "New Session", session_type: str = "copilot") -> WorkspaceSession:
        session = WorkspaceSession(user_id=user_id, title=title, session_type=session_type)
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_session(self, session_id: str, user_id: str) -> WorkspaceSession | None:
        result = await self.db.execute(
            select(WorkspaceSession).where(WorkspaceSession.id == session_id, WorkspaceSession.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_session(
        self,
        session_id: str,
        user_id: str,
        *,
        title: str | None = None,
        pinned: bool | None = None,
    ) -> WorkspaceSession | None:
        session = await self.get_session(session_id, user_id)
        if not session:
            return None
        if title is not None:
            session.title = title.strip() or session.title
        if pinned is not None:
            session.pinned = pinned
        await self.db.flush()
        return session

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        session = await self.get_session(session_id, user_id)
        if not session:
            return False
        await self.db.delete(session)
        await self.db.flush()
        return True

    async def get_messages(self, session_id: str, limit: int = 50) -> list[WorkspaceMessage]:
        result = await self.db.execute(
            select(WorkspaceMessage)
            .where(WorkspaceMessage.session_id == session_id)
            .order_by(WorkspaceMessage.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def add_message(self, session_id: str, role: str, content: str, context: dict | None = None) -> WorkspaceMessage:
        msg = WorkspaceMessage(session_id=session_id, role=role, content=content, intelligence_context=context)
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def record_action(self, user_id: str, rec_type: str, rec_title: str, action: str) -> RecommendationAction:
        rec = RecommendationAction(user_id=user_id, recommendation_type=rec_type, recommendation_title=rec_title, action=action)
        self.db.add(rec)
        await self.db.flush()
        return rec

    async def get_actions(self, user_id: str) -> list[RecommendationAction]:
        result = await self.db.execute(
            select(RecommendationAction)
            .where(RecommendationAction.user_id == user_id)
            .order_by(RecommendationAction.created_at.desc())
            .limit(50)
        )
        return list(result.scalars().all())
