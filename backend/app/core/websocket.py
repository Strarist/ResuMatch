from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set, Any, Optional, Tuple, AsyncGenerator
import json
import asyncio
from redis.asyncio import Redis
from datetime import datetime
import uuid
from app.core.config import settings
from app.core.metrics import (
    WS_CONNECTIONS,
    WS_MESSAGES,
    WS_CONNECTION_DURATION,
    track_websocket_metrics
)
from app.core.logging import log_websocket_event, get_logger
from app.api.deps import get_current_user
from fastapi.websockets import WebSocketState
from app.schemas.matching import WSMessage, WSMessageType, MatchResult, MatchUpdate
import logging
from uuid import UUID

logger = get_logger(__name__)

class RedisWebSocketManager:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = Redis.from_url(redis_url, decode_responses=True)
        self.connection_manager = ConnectionManager()
        self.pubsub = self.redis.pubsub()
        
    async def connect(self, websocket: WebSocket, user_id: UUID) -> None:
        """Connect a websocket and subscribe to user's channel"""
        await websocket.accept()
        self.connection_manager.connect(websocket, user_id)
        
        # Subscribe to user's Redis channel
        user_channel = f"user:{user_id}"
        self.pubsub.subscribe(user_channel)
        
    async def disconnect(self, websocket: WebSocket, user_id: UUID) -> None:
        """Disconnect a websocket and unsubscribe from user's channel"""
        self.connection_manager.disconnect(websocket, user_id)
        
        # Unsubscribe from user's Redis channel
        user_channel = f"user:{user_id}"
        self.pubsub.unsubscribe(user_channel)
        
    async def send_message(self, user_id: UUID, message: Dict[str, Any]) -> None:
        """Send a message to a specific user via Redis"""
        user_channel = f"user:{user_id}"
        message_str = json.dumps(message)
        self.redis.publish(user_channel, message_str)
        
    async def broadcast_message(self, message: Dict[str, Any]) -> None:
        """Broadcast a message to all users via Redis"""
        message_str = json.dumps(message)
        self.redis.publish("broadcast", message_str)
        
    async def listen_for_messages(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Listen for Redis messages and yield them"""
        try:
            for message in self.pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        yield data
                    except json.JSONDecodeError as e:
                        logger.error(f"Error decoding message: {e}")
        except Exception as e:
            logger.error(f"Error listening for messages: {e}")
            
    async def handle_websocket_connection(self, websocket: WebSocket, user_id: UUID) -> None:
        """Handle a websocket connection"""
        await self.connect(websocket, user_id)
        
        try:
            # Start listening for Redis messages
            async for message in self.listen_for_messages():
                await websocket.send_text(json.dumps(message))
        except WebSocketDisconnect:
            await self.disconnect(websocket, user_id)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await self.disconnect(websocket, user_id)

# Global instance
manager = RedisWebSocketManager()

async def get_websocket_manager() -> RedisWebSocketManager:
    """Get the websocket manager instance"""
    return manager

# WebSocket connection dependency
async def get_websocket_connection(
    websocket: WebSocket,
    ws_type: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
) -> tuple[str, RedisWebSocketManager]:
    """Dependency to handle WebSocket connection"""
    client_id = await manager.connect_websocket(
        websocket,
        ws_type,
        current_user.id if current_user else None
    )
    try:
        yield client_id, manager
    finally:
        await manager.disconnect_websocket(client_id, ws_type)

class ConnectionManager:
    def __init__(self) -> None:
        # Active connections by type and ID
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {
            'resume': {},
            'job': {},
            'global': set()
        }
        
        # Connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        
        # Message queues for each connection
        self.message_queues: Dict[WebSocket, asyncio.Queue] = {}
        
        # Heartbeat settings
        self.heartbeat_interval = 30
        
        # Start heartbeat task
        asyncio.create_task(self._heartbeat_loop())
    
    async def connect(
        self,
        websocket: WebSocket,
        connection_type: str,
        entity_id: Optional[str] = None
    ) -> None:
        """Connect a new WebSocket client."""
        await websocket.accept()
        
        # Initialize message queue
        self.message_queues[websocket] = asyncio.Queue()
        
        # Store connection metadata
        self.connection_metadata[websocket] = {
            'type': connection_type,
            'entity_id': entity_id,
            'connected_at': datetime.utcnow(),
            'last_heartbeat': datetime.utcnow()
        }
        
        # Add to appropriate connection sets
        if connection_type == 'global':
            self.active_connections['global'].add(websocket)
        else:
            if entity_id not in self.active_connections[connection_type]:
                self.active_connections[connection_type][entity_id] = set()
            self.active_connections[connection_type][entity_id].add(websocket)
        
        # Start message processing task
        asyncio.create_task(self._process_messages(websocket))
        
        logger.info(
            f"New WebSocket connection: {connection_type}"
            f"{f' - {entity_id}' if entity_id else ''}"
        )
    
    async def disconnect(self, websocket: WebSocket) -> None:
        """Disconnect a WebSocket client."""
        metadata = self.connection_metadata.get(websocket)
        if metadata:
            connection_type = metadata['type']
            entity_id = metadata['entity_id']
            
            # Remove from connection sets
            if connection_type == 'global':
                self.active_connections['global'].discard(websocket)
            else:
                if entity_id and entity_id in self.active_connections[connection_type]:
                    self.active_connections[connection_type][entity_id].discard(websocket)
                    if not self.active_connections[connection_type][entity_id]:
                        del self.active_connections[connection_type][entity_id]
            
            # Clean up metadata and queue
            del self.connection_metadata[websocket]
            del self.message_queues[websocket]
            
            logger.info(
                f"WebSocket disconnected: {connection_type}"
                f"{f' - {entity_id}' if entity_id else ''}"
            )
    
    async def broadcast(
        self,
        message: WSMessage,
        connection_type: Optional[str] = None,
        entity_id: Optional[str] = None
    ) -> None:
        """Broadcast a message to relevant connections."""
        # Get target connections
        target_connections: Set[WebSocket] = set()
        
        # Add global connections
        target_connections.update(self.active_connections['global'])
        
        # Add type-specific connections
        if connection_type:
            if entity_id:
                # Specific entity connections
                if entity_id in self.active_connections[connection_type]:
                    target_connections.update(
                        self.active_connections[connection_type][entity_id]
                    )
            else:
                # All connections of this type
                for connections in self.active_connections[connection_type].values():
                    target_connections.update(connections)
        
        # Queue message for each connection
        for websocket in target_connections:
            if websocket.client_state == WebSocketState.CONNECTED:
                await self.message_queues[websocket].put(message)
    
    async def _process_messages(self, websocket: WebSocket) -> None:
        """Process messages for a connection."""
        try:
            while True:
                # Get message from queue
                message = await self.message_queues[websocket].get()
                
                try:
                    # Send message
                    await websocket.send_json(message.dict())
                    
                    # Update last heartbeat
                    if message.type == WSMessageType.PROGRESS:
                        self.connection_metadata[websocket]['last_heartbeat'] = datetime.utcnow()
                
                except WebSocketDisconnect:
                    await self.disconnect(websocket)
                    break
                except Exception as e:
                    logger.error(f"Error sending message: {e}")
                    if websocket.client_state != WebSocketState.CONNECTED:
                        await self.disconnect(websocket)
                        break
                
                finally:
                    self.message_queues[websocket].task_done()
        
        except Exception as e:
            logger.error(f"Error in message processing: {e}")
            await self.disconnect(websocket)
    
    async def _heartbeat_loop(self) -> None:
        """Send periodic heartbeats to check connection health."""
        while True:
            try:
                # Create heartbeat message
                heartbeat = WSMessage(
                    type=WSMessageType.PROGRESS,
                    payload={'status': 'heartbeat'},
                    timestamp=datetime.utcnow()
                )
                
                # Check all connections
                for websocket in list(self.connection_metadata.keys()):
                    try:
                        if websocket.client_state == WebSocketState.CONNECTED:
                            # Check last heartbeat
                            last_heartbeat = self.connection_metadata[websocket]['last_heartbeat']
                            if (datetime.utcnow() - last_heartbeat).total_seconds() > self.heartbeat_interval * 2:
                                # Connection is stale, disconnect
                                await self.disconnect(websocket)
                            else:
                                # Send heartbeat
                                await self.message_queues[websocket].put(heartbeat)
                    
                    except Exception as e:
                        logger.error(f"Error in heartbeat check: {e}")
                        await self.disconnect(websocket)
            
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
            
            await asyncio.sleep(self.heartbeat_interval)
    
    async def send_match_update(self, match_result: MatchResult) -> None:
        """Send a match update to relevant connections."""
        message = WSMessage(
            type=WSMessageType.MATCH_UPDATE,
            payload=match_result,
            timestamp=datetime.utcnow()
        )
        
        # Broadcast to both resume and job connections
        await self.broadcast(message, 'resume', match_result.resume_id)
        await self.broadcast(message, 'job', match_result.job_id)
    
    async def send_cache_invalidation(self, update: MatchUpdate) -> None:
        """Send a cache invalidation notification."""
        message = WSMessage(
            type=WSMessageType.CACHE_INVALIDATION,
            payload=update,
            timestamp=datetime.utcnow()
        )
        
        await self.broadcast(message, update.type, update.id)
    
    async def send_error(
        self,
        error: str,
        connection_type: Optional[str] = None,
        entity_id: Optional[str] = None
    ) -> None:
        """Send an error message to relevant connections."""
        message = WSMessage(
            type=WSMessageType.ERROR,
            payload={'error': error},
            timestamp=datetime.utcnow()
        )
        
        await self.broadcast(message, connection_type, entity_id)

# Global connection manager instance
manager = ConnectionManager() 