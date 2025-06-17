from locust import HttpUser, task, between, events
import json
import random
import time
from typing import Dict, Any, Optional

class APIUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self) -> None:
        """Login and get token on start"""
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "username": "test@example.com",
                "password": "testpassword"
            }
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.environment.runner.quit()
            
    @task(3)
    def get_resumes(self) -> None:
        """Test resume listing"""
        self.client.get(
            "/api/v1/resumes/",
            headers=self.headers,
            params={"skip": 0, "limit": 10}
        )
        
    @task(2)
    def get_jobs(self) -> None:
        """Test job listing"""
        self.client.get(
            "/api/v1/jobs/",
            headers=self.headers,
            params={"skip": 0, "limit": 10}
        )
        
    @task(1)
    def get_matches(self) -> None:
        """Test match listing"""
        self.client.get(
            "/api/v1/matches/",
            headers=self.headers
        )
        
    @task(1)
    def create_resume(self) -> None:
        """Test resume creation"""
        # Generate random resume data
        resume_data = {
            "title": f"Test Resume {random.randint(1, 1000)}",
            "content": "Test resume content with some skills and experience.",
            "skills": ["Python", "FastAPI", "Testing"],
            "experience": [
                {
                    "title": "Software Engineer",
                    "company": "Test Company",
                    "duration": "2 years"
                }
            ]
        }
        
        self.client.post(
            "/api/v1/resumes/",
            headers=self.headers,
            json=resume_data
        )
        
    @task(1)
    def create_job(self) -> None:
        """Test job creation"""
        # Generate random job data
        job_data = {
            "title": f"Test Job {random.randint(1, 1000)}",
            "description": "Test job description with required skills.",
            "company": "Test Company",
            "location": "Remote",
            "salary_range": {
                "min": 50000,
                "max": 100000
            },
            "required_skills": ["Python", "FastAPI", "Testing"],
            "experience_level": "mid"
        }
        
        self.client.post(
            "/api/v1/jobs/",
            headers=self.headers,
            json=job_data
        )

class WebSocketUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self) -> None:
        """Login and connect WebSocket on start"""
        # Login to get token
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "username": "test@example.com",
                "password": "testpassword"
            }
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
        else:
            self.environment.runner.quit()
            
        # Connect WebSocket
        self.ws = self.client.websocket_connect(
            f"/api/v1/ws/analysis?token={self.token}",
            name="analysis_ws"
        )
        
    def on_stop(self) -> None:
        """Close WebSocket connection on stop"""
        if hasattr(self, "ws"):
            self.ws.close()
            
    @task(3)
    def receive_analysis_updates(self) -> None:
        """Test receiving analysis updates"""
        try:
            # Wait for message with timeout
            message = self.ws.receive()
            if message:
                data = json.loads(message)
                # Simulate processing time
                time.sleep(random.uniform(0.1, 0.5))
        except Exception as e:
            self.environment.runner.quit()
            
    @task(1)
    def switch_to_matches(self) -> None:
        """Test switching to matches WebSocket"""
        # Close current connection
        self.ws.close()
        
        # Connect to matches WebSocket
        self.ws = self.client.websocket_connect(
            f"/api/v1/ws/matches?token={self.token}",
            name="matches_ws"
        )
        
        # Receive some messages
        for _ in range(3):
            try:
                message = self.ws.receive()
                if message:
                    data = json.loads(message)
                    time.sleep(random.uniform(0.1, 0.5))
            except Exception:
                break
                
        # Switch back to analysis
        self.ws.close()
        self.ws = self.client.websocket_connect(
            f"/api/v1/ws/analysis?token={self.token}",
            name="analysis_ws"
        )

class MixedUser(APIUser, WebSocketUser):
    """User that performs both HTTP and WebSocket operations"""
    wait_time = between(1, 4)
    
    def on_start(self) -> None:
        """Initialize both HTTP and WebSocket connections"""
        APIUser.on_start(self)
        WebSocketUser.on_start(self)
        
    def on_stop(self) -> None:
        """Clean up both connections"""
        WebSocketUser.on_stop(self)
        
    @task(2)
    def mixed_operation(self) -> None:
        """Perform mixed HTTP and WebSocket operations"""
        # Get some resumes
        self.get_resumes()
        
        # Receive WebSocket update
        try:
            message = self.ws.receive()
            if message:
                data = json.loads(message)
                # Create a job based on received data
                if "skills" in data:
                    job_data = {
                        "title": f"Job for {data['skills'][0]}",
                        "description": "Test job description",
                        "company": "Test Company",
                        "location": "Remote",
                        "salary_range": {
                            "min": 50000,
                            "max": 100000
                        },
                        "required_skills": data["skills"],
                        "experience_level": "mid"
                    }
                    
                    self.client.post(
                        "/api/v1/jobs/",
                        headers=self.headers,
                        json=job_data
                    )
        except Exception:
            pass

# Event listeners
@events.init.add_listener
def on_locust_init(environment: Any, **kwargs: Any) -> None:
    """Initialize test environment"""
    print("Locust test environment initialized")

@events.request.add_listener
def on_request(request_type: str, name: str, response_time: float, response_length: int, exception: Optional[Exception], **kwargs: Any) -> None:
    """Log request events"""
    if exception:
        print(f"Request failed: {name} - {exception}")

@events.test_start.add_listener
def on_test_start(**kwargs: Any) -> None:
    """Handle test start"""
    print("Load test started")

@events.test_stop.add_listener
def on_test_stop(**kwargs: Any) -> None:
    """Handle test stop"""
    print("Load test completed") 