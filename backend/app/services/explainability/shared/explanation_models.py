from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class SignalImpact(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    signal_name: str
    weight: float
    impact_direction: str # POSITIVE, NEGATIVE, NEUTRAL
    rationale: str

class ExplanationModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    explanation_type: str
    summary: str
    causal_factors: List[SignalImpact]
    uncertainty_level: str # HIGH, MEDIUM, LOW
    confidence_delta: float

class CausalEdgeModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    source: str
    target: str
    weight: float
    description: str
