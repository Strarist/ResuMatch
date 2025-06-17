import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Dict, Any
import json
from datetime import datetime

# Create logger instance
logger = logging.getLogger("resumatch")

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    def format(self, record: logging.LogRecord) -> str:
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info)
            }
        
        return json.dumps(log_data)

def setup_logging(
    log_level: str = "INFO",
    log_file: str = "app.log",
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> None:
    """Configure logging for the application"""
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler with JSON formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)
    
    # File handler with JSON formatting
    file_handler = RotatingFileHandler(
        log_dir / log_file,
        maxBytes=max_file_size,
        backupCount=backup_count
    )
    file_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(file_handler)
    
    # Set logging levels for specific modules
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Configure resumatch logger
    logger.setLevel(log_level)
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

# Initialize logging
setup_logging()

def log_api_request(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: str = None,
    **extra: Any
) -> None:
    """Log API request details"""
    logger.info(
        "API Request",
        extra={
            "method": method,
            "path": path,
            "status_code": status_code,
            "duration_ms": duration_ms,
            "user_id": user_id,
            **extra
        }
    )

def log_api_error(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    error_code: str,
    error_message: str,
    user_id: str = None,
    **extra: Any
) -> None:
    """Log API error details"""
    logger.error(
        "API Error",
        extra={
            "method": method,
            "path": path,
            "status_code": status_code,
            "error_code": error_code,
            "error_message": error_message,
            "user_id": user_id,
            **extra
        }
    )

def log_analysis_event(
    logger: logging.Logger,
    event_type: str,
    resource_id: str,
    resource_type: str,
    status: str,
    user_id: str = None,
    **extra: Any
) -> None:
    """Log analysis-related events"""
    logger.info(
        f"Analysis {event_type}",
        extra={
            "resource_id": resource_id,
            "resource_type": resource_type,
            "status": status,
            "user_id": user_id,
            **extra
        }
    ) 