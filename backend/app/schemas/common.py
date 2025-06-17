from typing import TypeVar, Generic, Optional, Any, List, Dict
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')

class ErrorDetail(BaseModel):
    """Schema for error details"""
    code: str = Field(..., description="Error code for frontend handling")
    message: str = Field(..., description="User-friendly error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: ErrorDetail = Field(..., description="Error information")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

class PaginationParams(BaseModel):
    """Schema for pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(10, ge=1, le=100, description="Items per page")
    total: int = Field(..., description="Total number of items")
    pages: int = Field(..., description="Total number of pages")

class PaginatedResponse(BaseModel, Generic[T]):
    """Schema for paginated responses"""
    items: List[T] = Field(..., description="List of items")
    pagination: PaginationParams = Field(..., description="Pagination information")

class SuccessResponse(BaseModel, Generic[T]):
    """Schema for success responses"""
    data: T = Field(..., description="Response data")
    message: Optional[str] = Field(None, description="Success message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

class AnalysisResponse(BaseModel):
    """Schema for analysis responses"""
    status: str = Field(..., description="Analysis status (pending, completed, failed)")
    progress: Optional[float] = Field(None, ge=0, le=100, description="Analysis progress percentage")
    result: Optional[Dict[str, Any]] = Field(None, description="Analysis results")
    error: Optional[ErrorDetail] = Field(None, description="Error information if analysis failed")
    started_at: datetime = Field(..., description="Analysis start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Analysis completion timestamp")

# Common error codes
class ErrorCodes:
    """Standard error codes for frontend handling"""
    # Authentication errors
    AUTH_INVALID_CREDENTIALS = "AUTH_001"
    AUTH_TOKEN_EXPIRED = "AUTH_002"
    AUTH_INVALID_TOKEN = "AUTH_003"
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_004"
    
    # Resource errors
    RESOURCE_NOT_FOUND = "RES_001"
    RESOURCE_ALREADY_EXISTS = "RES_002"
    RESOURCE_INVALID = "RES_003"
    RESOURCE_DELETION_FAILED = "RES_004"
    
    # Validation errors
    VALIDATION_ERROR = "VAL_001"
    VALIDATION_FILE_TOO_LARGE = "VAL_002"
    VALIDATION_INVALID_FILE_TYPE = "VAL_003"
    
    # Analysis errors
    ANALYSIS_FAILED = "ANAL_001"
    ANALYSIS_TIMEOUT = "ANAL_002"
    ANALYSIS_INVALID_INPUT = "ANAL_003"
    
    # Rate limiting
    RATE_LIMIT_EXCEEDED = "RATE_001"
    
    # Server errors
    SERVER_ERROR = "SRV_001"
    DATABASE_ERROR = "SRV_002"
    EXTERNAL_SERVICE_ERROR = "SRV_003" 