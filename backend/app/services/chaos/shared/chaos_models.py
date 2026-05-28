"""Data models for chaos simulations."""

from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict

class ChaosEvent(BaseModel):
    """Represents a single chaos event occurrence."""
    timestamp: datetime = datetime.utcnow()
    component: str
    event_type: str
    metadata: Dict[str, Any] = {}
