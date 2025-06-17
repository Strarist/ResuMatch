from typing import Dict, Any, List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.websockets import WebSocketState
from sqlalchemy.orm import Session
import json
import asyncio
from datetime import datetime
from uuid import UUID

from app.api.deps import get_current_user_ws
from app.db.base import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.schemas.common import ErrorResponse, ErrorCodes
from app.core.logging import log_analysis_event, get_logger
from app.services.resume_matcher import ResumeMatcher
from app.core.websocket import get_websocket_manager, RedisWebSocketManager

logger = get_logger(__name__)
router = APIRouter()
matcher = ResumeMatcher()

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        # Store connections by user_id and analysis_id
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: UUID):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: UUID):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def broadcast_to_user(self, user_id: UUID, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except WebSocketDisconnect:
                    self.disconnect(connection, user_id)

manager = ConnectionManager()

@router.websocket("/ws/analysis/{user_id}")
async def websocket_analysis_endpoint(
    websocket: WebSocket,
    user_id: int,
    manager: RedisWebSocketManager = Depends(get_websocket_manager)
) -> None:
    """WebSocket endpoint for analysis updates"""
    try:
        await manager.connect(websocket, user_id)
        await manager.handle_websocket_connection(websocket, user_id)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, user_id)

@router.websocket("/ws/matches/{user_id}")
async def websocket_matches_endpoint(
    websocket: WebSocket,
    user_id: int,
    manager: RedisWebSocketManager = Depends(get_websocket_manager)
) -> None:
    """WebSocket endpoint for match updates"""
    try:
        await manager.connect(websocket, user_id)
        await manager.handle_websocket_connection(websocket, user_id)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, user_id)

@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(
    websocket: WebSocket,
    user_id: int,
    manager: RedisWebSocketManager = Depends(get_websocket_manager)
) -> None:
    """WebSocket endpoint for notifications"""
    try:
        await manager.connect(websocket, user_id)
        await manager.handle_websocket_connection(websocket, user_id)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.disconnect(websocket, user_id)

@router.post("/ws/send-message/{user_id}")
async def send_websocket_message(
    user_id: int,
    message: dict,
    manager: RedisWebSocketManager = Depends(get_websocket_manager)
) -> dict:
    """Send a message to a specific user via WebSocket"""
    try:
        await manager.send_message(user_id, message)
        return {"status": "success", "message": "Message sent"}
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")

@router.post("/ws/broadcast")
async def broadcast_websocket_message(
    message: dict,
    manager: RedisWebSocketManager = Depends(get_websocket_manager)
) -> dict:
    """Broadcast a message to all connected users"""
    try:
        await manager.broadcast_message(message)
        return {"status": "success", "message": "Message broadcasted"}
    except Exception as e:
        logger.error(f"Error broadcasting message: {e}")
        raise HTTPException(status_code=500, detail="Failed to broadcast message")

async def broadcast_analysis_update(
    db: Session,
    analysis_id: str,
    user_id: str,
    status: str,
    progress: float = None,
    result: Dict[str, Any] = None,
    error: str = None
):
    """Broadcast analysis update to connected clients"""
    update_data = {
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if progress is not None:
        update_data["progress"] = progress
    
    if result is not None:
        update_data["result"] = result
    
    if error is not None:
        update_data["error"] = {
            "code": ErrorCodes.ANALYSIS_ERROR,
            "message": error
        }
    
    # Log the analysis event
    log_analysis_event(
        analysis_id=analysis_id,
        user_id=user_id,
        status=status,
        progress=progress,
        error=error
    )
    
    # Send update to connected clients
    await manager.broadcast_to_user(user_id, update_data)

# Helper function to get analysis type and related object
async def get_analysis_info(db: Session, analysis_id: str) -> tuple[str, Any]:
    """Get analysis type and related object from analysis_id"""
    # Check if it's a resume analysis
    resume = db.query(Resume).filter(Resume.id == analysis_id).first()
    if resume:
        return "resume", resume
    
    # Check if it's a job analysis
    job = db.query(Job).filter(Job.id == analysis_id).first()
    if job:
        return "job", job
    
    return None, None

@router.websocket("/ws/matches/{analysis_id}")
async def websocket_matches_endpoint(
    websocket: WebSocket,
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_ws)
):
    """WebSocket endpoint for real-time match updates"""
    try:
        # Get analysis type and object
        analysis_type, obj = await get_analysis_info(db, analysis_id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found"
            )
        
        # Verify user has access to the analysis
        if analysis_type == "resume" and obj.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this analysis"
            )
        
        await manager.connect(websocket, current_user.id)
        
        # Send initial connection success message
        await websocket.send_json({
            "type": "connection_established",
            "analysis_id": analysis_id,
            "analysis_type": analysis_type,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and handle client messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages (e.g., refresh matches)
                if message.get("type") == "refresh_matches":
                    # Implement match refresh logic here
                    await websocket.send_json({
                        "type": "matches_updated",
                        "analysis_id": analysis_id,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "error": {
                        "code": ErrorCodes.VALIDATION_ERROR,
                        "message": "Invalid message format"
                    },
                    "timestamp": datetime.utcnow().isoformat()
                })
    
    except HTTPException as e:
        if websocket.client_state != WebSocketState.DISCONNECTED:
            await websocket.send_json({
                "type": "error",
                "error": {
                    "code": e.status_code,
                    "message": e.detail
                },
                "timestamp": datetime.utcnow().isoformat()
            })
    finally:
        manager.disconnect(str(current_user.id), f"matches_{analysis_id}")

async def broadcast_match_update(
    db: Session,
    analysis_id: str,
    user_id: str,
    matches: List[Dict[str, Any]]
):
    """Broadcast match update to connected clients"""
    update_data = {
        "matches": matches,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Log the match update event
    log_analysis_event(
        analysis_id=analysis_id,
        user_id=user_id,
        status="matches_updated",
        matches_count=len(matches)
    )
    
    # Send update to connected clients
    await manager.broadcast_to_user(user_id, update_data) 