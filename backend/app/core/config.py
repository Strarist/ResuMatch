from typing import List, Optional, Union, Dict, Any
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator, PostgresDsn
import secrets
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "ResuMatch AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:8000",  # Backend
        "http://localhost:8080",  # Alternative frontend port
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Project metadata
    DESCRIPTION: str = "AI-powered resume and job matching platform"
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "resumatch"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if isinstance(v, str):
            return v
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}/{values.get('POSTGRES_DB')}"

    # Logging configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    LOG_MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT: int = 5
    LOG_DIR: Path = Path("logs")
    
    # Rate limiting configuration
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_BURST_SIZE: int = 10
    
    # File upload configuration
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = ["pdf", "doc", "docx", "txt"]
    UPLOAD_DIR: Path = Path("uploads")
    
    # AI model configuration
    SPACY_MODEL: str = "en_core_web_lg"
    TRANSFORMER_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Matching configuration
    MATCH_SKILL_WEIGHT: float = 0.6
    MATCH_EXPERIENCE_WEIGHT: float = 0.4
    MIN_MATCH_SCORE: float = 0.3

    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    @validator("REDIS_URL", pre=True)
    def assemble_redis_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        auth = f":{values.get('REDIS_PASSWORD')}@" if values.get("REDIS_PASSWORD") else ""
        return f"redis://{auth}{values.get('REDIS_HOST')}:{values.get('REDIS_PORT')}/{values.get('REDIS_DB')}"
    
    # Metrics settings
    METRICS_ENABLED: bool = True
    METRICS_PORT: int = 8000
    METRICS_PATH: str = "/metrics"
    METRICS_UPDATE_INTERVAL: int = 15  # seconds
    
    # WebSocket settings
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_MAX_MESSAGE_SIZE: int = 1024 * 1024  # 1MB
    WS_PING_INTERVAL: int = 20  # seconds
    WS_PING_TIMEOUT: int = 10  # seconds
    
    # Cache settings
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000  # items
    CACHE_TYPE: str = "redis"  # or "memory"
    
    # Background task settings
    MAX_WORKERS: int = 4
    TASK_TIMEOUT: int = 300  # 5 minutes
    TASK_RETRY_LIMIT: int = 3
    
    # Security settings
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_MAX_LENGTH: int = 100
    PASSWORD_REGEX: str = r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings() 