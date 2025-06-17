import pytest
import json
import asyncio
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
from app.schemas.common import ErrorCodes
from app.tests.conftest import assert_success_response
from typing import AsyncGenerator, Dict, Any
import websockets
import uuid

from app.main import app
from app.core.websocket import manager as ws_manager
from app.core.metrics import WS_CONNECTIONS, WS_MESSAGES
from app.core.logging import log_websocket_event

# Test client
client = TestClient(app)

# Test data
TEST_USER = {
    "email": "test@example.com",
    "password": "testpassword"
}

@pytest.fixture
async def auth_token() -> str:
    """Get authentication token"""
    response = client.post(
        "/api/v1/auth/login",
        json=TEST_USER
    )
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture
async def ws_client(auth_token: str) -> AsyncGenerator[websockets.WebSocketClientProtocol, None]:
    """WebSocket test client"""
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as websocket:
        yield websocket

@pytest.mark.asyncio
async def test_websocket_connection(auth_token: str):
    """Test WebSocket connection and authentication"""
    # Connect to WebSocket
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as websocket:
        # Check connection metrics
        assert WS_CONNECTIONS.labels(type="analysis")._value.get() == 1
        
        # Send test message
        test_message = {
            "type": "test",
            "data": {"message": "Hello, WebSocket!"}
        }
        await websocket.send(json.dumps(test_message))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        
        # Verify message format
        assert "type" in data
        assert "data" in data
        assert "timestamp" in data
        
        # Check message metrics
        assert WS_MESSAGES.labels(type="analysis", direction="sent")._value.get() > 0

@pytest.mark.asyncio
async def test_websocket_authentication():
    """Test WebSocket authentication failure"""
    # Try connecting without token
    uri = "ws://testserver/api/v1/ws/analysis"
    with pytest.raises(websockets.exceptions.InvalidStatusCode) as exc_info:
        async with websockets.connect(uri) as websocket:
            pass
    assert exc_info.value.status_code == 401
    
    # Try connecting with invalid token
    uri = "ws://testserver/api/v1/ws/analysis?token=invalid"
    with pytest.raises(websockets.exceptions.InvalidStatusCode) as exc_info:
        async with websockets.connect(uri) as websocket:
            pass
    assert exc_info.value.status_code == 401

@pytest.mark.asyncio
async def test_websocket_broadcast(auth_token: str):
    """Test WebSocket broadcast functionality"""
    # Connect two clients
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as ws1, websockets.connect(uri) as ws2:
        # Broadcast message
        test_message = {
            "type": "broadcast",
            "data": {"message": "Broadcast test"}
        }
        await ws_manager.broadcast(test_message, "analysis")
        
        # Both clients should receive the message
        response1 = await ws1.recv()
        response2 = await ws2.recv()
        
        data1 = json.loads(response1)
        data2 = json.loads(response2)
        
        assert data1["type"] == "broadcast"
        assert data2["type"] == "broadcast"
        assert data1["data"]["message"] == "Broadcast test"
        assert data2["data"]["message"] == "Broadcast test"

@pytest.mark.asyncio
async def test_websocket_personal_message(auth_token: str):
    """Test WebSocket personal message functionality"""
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as websocket:
        # Get client ID from connection
        client_id = list(ws_manager.active_connections["analysis"].keys())[0]
        
        # Send personal message
        test_message = {
            "type": "personal",
            "data": {"message": "Personal test"}
        }
        await ws_manager.send_personal_message(test_message, client_id, "analysis")
        
        # Client should receive the message
        response = await websocket.recv()
        data = json.loads(response)
        
        assert data["type"] == "personal"
        assert data["data"]["message"] == "Personal test"

@pytest.mark.asyncio
async def test_websocket_connection_limits(auth_token: str):
    """Test WebSocket connection limits and cleanup"""
    # Create multiple connections
    connections = []
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    
    try:
        for _ in range(5):
            websocket = await websockets.connect(uri)
            connections.append(websocket)
            
        # Check connection count
        assert ws_manager.get_active_connections_count("analysis") == 5
        
        # Close connections
        for websocket in connections:
            await websocket.close()
            
        # Check cleanup
        assert ws_manager.get_active_connections_count("analysis") == 0
        
    finally:
        # Ensure all connections are closed
        for websocket in connections:
            if not websocket.closed:
                await websocket.close()

@pytest.mark.asyncio
async def test_websocket_message_validation(auth_token: str):
    """Test WebSocket message validation"""
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as websocket:
        # Send invalid message format
        invalid_message = "invalid json"
        await websocket.send(invalid_message)
        
        # Should receive error response
        response = await websocket.recv()
        data = json.loads(response)
        
        assert data["type"] == "error"
        assert "message" in data["data"]
        
        # Send message without required fields
        incomplete_message = {
            "data": {"message": "Missing type"}
        }
        await websocket.send(json.dumps(incomplete_message))
        
        # Should receive error response
        response = await websocket.recv()
        data = json.loads(response)
        
        assert data["type"] == "error"
        assert "message" in data["data"]

@pytest.mark.asyncio
async def test_websocket_heartbeat(auth_token: str):
    """Test WebSocket heartbeat mechanism"""
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as websocket:
        # Send ping
        ping_message = {
            "type": "ping",
            "data": {"timestamp": str(uuid.uuid4())}
        }
        await websocket.send(json.dumps(ping_message))
        
        # Should receive pong
        response = await websocket.recv()
        data = json.loads(response)
        
        assert data["type"] == "pong"
        assert "timestamp" in data["data"]

@pytest.mark.asyncio
async def test_websocket_redis_pubsub(auth_token: str):
    """Test WebSocket Redis pub/sub functionality"""
    # Connect two clients to different instances
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as ws1, websockets.connect(uri) as ws2:
        # Simulate message from another instance
        test_message = {
            "type": "cross_instance",
            "data": {"message": "From another instance"},
            "instance_id": str(uuid.uuid4())
        }
        
        # Publish to Redis
        await ws_manager.redis.publish(
            "ws:analysis",
            json.dumps({
                "message": test_message,
                "timestamp": "2024-01-01T00:00:00Z",
                "instance_id": test_message["instance_id"]
            })
        )
        
        # Both clients should receive the message
        response1 = await ws1.recv()
        response2 = await ws2.recv()
        
        data1 = json.loads(response1)
        data2 = json.loads(response2)
        
        assert data1["type"] == "cross_instance"
        assert data2["type"] == "cross_instance"
        assert data1["data"]["message"] == "From another instance"
        assert data2["data"]["message"] == "From another instance"

@pytest.mark.asyncio
async def test_websocket_error_handling(auth_token: str):
    """Test WebSocket error handling"""
    uri = f"ws://testserver/api/v1/ws/analysis?token={auth_token}"
    async with websockets.connect(uri) as websocket:
        # Simulate various error conditions
        
        # 1. Message too large
        large_message = {
            "type": "large",
            "data": {"content": "x" * (settings.WS_MAX_MESSAGE_SIZE + 1)}
        }
        await websocket.send(json.dumps(large_message))
        
        response = await websocket.recv()
        data = json.loads(response)
        assert data["type"] == "error"
        assert "message" in data["data"]
        
        # 2. Invalid message type
        invalid_type_message = {
            "type": "invalid_type",
            "data": {"message": "Test"}
        }
        await websocket.send(json.dumps(invalid_type_message))
        
        response = await websocket.recv()
        data = json.loads(response)
        assert data["type"] == "error"
        assert "message" in data["data"]
        
        # 3. Malformed data
        malformed_message = {
            "type": "test",
            "data": None
        }
        await websocket.send(json.dumps(malformed_message))
        
        response = await websocket.recv()
        data = json.loads(response)
        assert data["type"] == "error"
        assert "message" in data["data"]

@pytest.mark.asyncio
async def test_websocket_analysis_connection_success(authorized_client: TestClient, test_resume: dict):
    """Test successful WebSocket connection for analysis updates"""
    with authorized_client.websocket_connect(
        f"/api/v1/ws/analysis/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket:
        # Check connection established message
        data = websocket.receive_json()
        assert data["type"] == "connection_established"
        assert data["analysis_id"] == test_resume["id"]
        assert "timestamp" in data

@pytest.mark.asyncio
async def test_websocket_analysis_unauthorized(client: TestClient, test_resume: dict):
    """Test WebSocket connection without authentication"""
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/api/v1/ws/analysis/{test_resume['id']}") as websocket:
            pass
    assert exc_info.value.code == 1000

@pytest.mark.asyncio
async def test_websocket_analysis_invalid_token(client: TestClient, test_resume: dict):
    """Test WebSocket connection with invalid token"""
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(
            f"/api/v1/ws/analysis/{test_resume['id']}?token=invalid_token"
        ) as websocket:
            pass
    assert exc_info.value.code == 1000

@pytest.mark.asyncio
async def test_websocket_analysis_cancel(authorized_client: TestClient, test_resume: dict):
    """Test canceling analysis through WebSocket"""
    with authorized_client.websocket_connect(
        f"/api/v1/ws/analysis/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket:
        # Send cancel message
        websocket.send_json({"type": "cancel_analysis"})
        
        # Check cancel confirmation
        data = websocket.receive_json()
        assert data["type"] == "analysis_cancelled"
        assert data["analysis_id"] == test_resume["id"]
        assert "timestamp" in data

@pytest.mark.asyncio
async def test_websocket_analysis_invalid_message(authorized_client: TestClient, test_resume: dict):
    """Test sending invalid message through WebSocket"""
    with authorized_client.websocket_connect(
        f"/api/v1/ws/analysis/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket:
        # Send invalid JSON
        websocket.send_text("invalid json")
        
        # Check error response
        data = websocket.receive_json()
        assert data["type"] == "error"
        assert data["error"]["code"] == ErrorCodes.VALIDATION_ERROR
        assert "timestamp" in data

@pytest.mark.asyncio
async def test_websocket_matches_connection_success(authorized_client: TestClient, test_resume: dict):
    """Test successful WebSocket connection for match updates"""
    with authorized_client.websocket_connect(
        f"/api/v1/ws/matches/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket:
        # Check connection established message
        data = websocket.receive_json()
        assert data["type"] == "connection_established"
        assert data["analysis_id"] == test_resume["id"]
        assert data["analysis_type"] == "resume"
        assert "timestamp" in data

@pytest.mark.asyncio
async def test_websocket_matches_unauthorized_access(authorized_client: TestClient, test_resume: dict):
    """Test WebSocket connection for matches with unauthorized access"""
    # Create a new user and get their token
    new_user_response = authorized_client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User",
        }
    )
    new_user_token = new_user_response.json()["data"]["access_token"]
    
    # Try to connect with new user's token
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with authorized_client.websocket_connect(
            f"/api/v1/ws/matches/{test_resume['id']}?token={new_user_token}"
        ) as websocket:
            pass
    assert exc_info.value.code == 1000

@pytest.mark.asyncio
async def test_websocket_matches_refresh(authorized_client: TestClient, test_resume: dict):
    """Test refreshing matches through WebSocket"""
    with authorized_client.websocket_connect(
        f"/api/v1/ws/matches/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket:
        # Send refresh message
        websocket.send_json({"type": "refresh_matches"})
        
        # Check refresh confirmation
        data = websocket.receive_json()
        assert data["type"] == "matches_updated"
        assert data["analysis_id"] == test_resume["id"]
        assert "timestamp" in data

@pytest.mark.asyncio
async def test_websocket_matches_not_found(authorized_client: TestClient):
    """Test WebSocket connection for non-existent analysis"""
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with authorized_client.websocket_connect(
            f"/api/v1/ws/matches/00000000-0000-0000-0000-000000000000?token={authorized_client.headers['Authorization'].split(' ')[1]}"
        ) as websocket:
            pass
    assert exc_info.value.code == 1000

@pytest.mark.asyncio
async def test_websocket_analysis_update_broadcast(authorized_client: TestClient, test_resume: dict):
    """Test broadcasting analysis updates to connected clients"""
    # Connect first client
    with authorized_client.websocket_connect(
        f"/api/v1/ws/analysis/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket1:
        # Connect second client
        with authorized_client.websocket_connect(
            f"/api/v1/ws/analysis/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
        ) as websocket2:
            # Start analysis
            response = authorized_client.post(f"/api/v1/resumes/{test_resume['id']}/analyze")
            analysis_id = response.json()["data"]["analysis_id"]
            
            # Wait for updates
            for _ in range(2):  # Both clients should receive updates
                data1 = websocket1.receive_json()
                data2 = websocket2.receive_json()
                
                assert data1["type"] == "analysis_update"
                assert data2["type"] == "analysis_update"
                assert data1["analysis_id"] == analysis_id
                assert data2["analysis_id"] == analysis_id
                assert "timestamp" in data1
                assert "timestamp" in data2

@pytest.mark.asyncio
async def test_websocket_matches_update_broadcast(authorized_client: TestClient, test_resume: dict, test_job: dict):
    """Test broadcasting match updates to connected clients"""
    # Connect first client
    with authorized_client.websocket_connect(
        f"/api/v1/ws/matches/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
    ) as websocket1:
        # Connect second client
        with authorized_client.websocket_connect(
            f"/api/v1/ws/matches/{test_resume['id']}?token={authorized_client.headers['Authorization'].split(' ')[1]}"
        ) as websocket2:
            # Trigger match update (e.g., by analyzing the resume)
            response = authorized_client.post(f"/api/v1/resumes/{test_resume['id']}/analyze")
            
            # Wait for updates
            for _ in range(2):  # Both clients should receive updates
                data1 = websocket1.receive_json()
                data2 = websocket2.receive_json()
                
                assert data1["type"] in ["matches_updated", "analysis_update"]
                assert data2["type"] in ["matches_updated", "analysis_update"]
                assert "timestamp" in data1
                assert "timestamp" in data2 