from fastapi import WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Set, Any, Optional
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
from app.core.logging import log_websocket_event
from app.api.deps import get_current_user_ws
from fastapi.websockets import WebSocketState
from app.schemas.matching import WSMessage, WSMessageType, MatchResult, MatchUpdate
import logging

logger = logging.getLogger(__name__)

class RedisWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {
            "analysis": {},
            "matches": {}
        }
        self.redis: Optional[Redis] = None
        self.pubsub: Optional[Any] = None
        self.instance_id = str(uuid.uuid4())
        
    async def connect(self):
        """Connect to Redis"""
        self.redis = Redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        self.pubsub = self.redis.pubsub()
        
        # Subscribe to channels
        await self.pubsub.subscribe(
            "ws:analysis",
            "ws:matches",
            f"ws:instance:{self.instance_id}"
        )
        
        # Start message listener
        asyncio.create_task(self._listen_messages())
        
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.pubsub:
            await self.pubsub.unsubscribe()
            await self.pubsub.close()
        if self.redis:
            await self.redis.close()
            
    async def _listen_messages(self):
        """Listen for messages from Redis"""
        while True:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True)
                if message:
                    await self._handle_redis_message(message)
            except Exception as e:
                log_websocket_event(
                    "error",
                    f"Error in Redis message listener: {str(e)}",
                    {"error": str(e)}
                )
                await asyncio.sleep(1)  # Prevent tight loop on error
                
    async def _handle_redis_message(self, message: Dict[str, Any]):
        """Handle incoming Redis message"""
        try:
            data = json.loads(message["data"])
            channel = message["channel"]
            ws_type = channel.split(":")[1]
            
            # Skip messages from self
            if data.get("instance_id") == self.instance_id:
                return
                
            # Forward message to local connections
            if ws_type in self.active_connections:
                for connection in self.active_connections[ws_type].values():
                    try:
                        await connection.send_json(data["message"])
                        track_websocket_metrics(ws_type, "sent")
                    except Exception as e:
                        log_websocket_event(
                            "error",
                            f"Error sending message to WebSocket: {str(e)}",
                            {"error": str(e)}
                        )
        except Exception as e:
            log_websocket_event(
                "error",
                f"Error handling Redis message: {str(e)}",
                {"error": str(e)}
            )
            
    async def connect_websocket(
        self,
        websocket: WebSocket,
        ws_type: str,
        user_id: Optional[int] = None
    ):
        """Connect a new WebSocket client"""
        await websocket.accept()
        client_id = str(uuid.uuid4())
        
        # Store connection
        self.active_connections[ws_type][client_id] = websocket
        
        # Update metrics
        WS_CONNECTIONS.labels(type=ws_type).inc()
        
        # Log connection
        log_websocket_event(
            "connect",
            f"WebSocket connected: {ws_type}",
            {
                "client_id": client_id,
                "user_id": user_id,
                "ws_type": ws_type
            }
        )
        
        return client_id
        
    async def disconnect_websocket(self, client_id: str, ws_type: str):
        """Disconnect a WebSocket client"""
        if client_id in self.active_connections[ws_type]:
            # Update metrics
            WS_CONNECTIONS.labels(type=ws_type).dec()
            
            # Log disconnection
            log_websocket_event(
                "disconnect",
                f"WebSocket disconnected: {ws_type}",
                {
                    "client_id": client_id,
                    "ws_type": ws_type
                }
            )
            
            # Remove connection
            del self.active_connections[ws_type][client_id]
            
    async def broadcast(
        self,
        message: Dict[str, Any],
        ws_type: str,
        exclude_client: Optional[str] = None
    ):
        """Broadcast message to all connected clients"""
        # Add metadata
        message_data = {
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "instance_id": self.instance_id
        }
        
        # Publish to Redis
        if self.redis:
            await self.redis.publish(
                f"ws:{ws_type}",
                json.dumps(message_data)
            )
            
        # Send to local connections
        for client_id, connection in self.active_connections[ws_type].items():
            if client_id != exclude_client:
                try:
                    await connection.send_json(message)
                    track_websocket_metrics(ws_type, "sent")
                except Exception as e:
                    log_websocket_event(
                        "error",
                        f"Error broadcasting message: {str(e)}",
                        {"error": str(e)}
                    )
                    
    async def send_personal_message(
        self,
        message: Dict[str, Any],
        client_id: str,
        ws_type: str
    ):
        """Send message to specific client"""
        if client_id in self.active_connections[ws_type]:
            try:
                await self.active_connections[ws_type][client_id].send_json(message)
                track_websocket_metrics(ws_type, "sent")
            except Exception as e:
                log_websocket_event(
                    "error",
                    f"Error sending personal message: {str(e)}",
                    {"error": str(e)}
                )
                
    def get_active_connections_count(self, ws_type: str) -> int:
        """Get number of active connections for a type"""
        return len(self.active_connections[ws_type])
        
    def get_total_connections_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())

# Global WebSocket manager instance
manager = RedisWebSocketManager()

async def get_websocket_manager() -> RedisWebSocketManager:
    """Dependency to get WebSocket manager"""
    return manager

# WebSocket connection dependency
async def get_websocket_connection(
    websocket: WebSocket,
    ws_type: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_ws)
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
    def __init__(self):
        # Active connections by type and ID
        self.active_connections: Dict[str, Dict[str, Set[WebSocket]]] = {
            'resume': {},
            'job': {},
            'match': {},
            'global': set()
        }
        
        # Connection metadata
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        
        # Message queue for each connection
        self.message_queues: Dict[WebSocket, asyncio.Queue] = {}
        
        # Heartbeat interval (seconds)
        self.heartbeat_interval = 30
        
        # Start heartbeat task
        asyncio.create_task(self._heartbeat_loop())
    
    async def connect(
        self,
        websocket: WebSocket,
        connection_type: str,
        entity_id: Optional[str] = None
    ):
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
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect a WebSocket client."""
        metadata = self.connection_metadata.get(websocket)
        if metadata:
            connection_type = metadata['type']
            entity_id = metadata['entity_id']
            
            # Remove from connection sets
            if connection_type == 'global':
                self.active_connections['global'].discard(websocket)
            else:
                if entity_id in self.active_connections[connection_type]:
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
    ):
        """Broadcast a message to relevant connections."""
        # Get target connections
        target_connections = set()
        
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
    
    async def _process_messages(self, websocket: WebSocket):
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
    
    async def _heartbeat_loop(self):
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
    
    async def send_match_update(self, match_result: MatchResult):
        """Send a match update to relevant connections."""
        message = WSMessage(
            type=WSMessageType.MATCH_UPDATE,
            payload=match_result,
            timestamp=datetime.utcnow()
        )
        
        # Broadcast to both resume and job connections
        await self.broadcast(message, 'resume', match_result.resume_id)
        await self.broadcast(message, 'job', match_result.job_id)
    
    async def send_cache_invalidation(self, update: MatchUpdate):
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
    ):
        """Send an error message to relevant connections."""
        message = WSMessage(
            type=WSMessageType.ERROR,
            payload={'error': error},
            timestamp=datetime.utcnow()
        )
        
        await self.broadcast(message, connection_type, entity_id)

# Global connection manager instance
manager = ConnectionManager() 