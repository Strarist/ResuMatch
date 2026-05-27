from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class CompressedSignal(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    signal_type: str
    strategic_importance: float  # 0.0 to 1.0
    urgency: str                 # HIGH, MEDIUM, LOW
    leverage_impact: float       # Coefficient multiplier
    confidence: float            # 0.0 to 1.0
    synthesis_summary: str

class ExecutionStorylinePoint(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    week: int
    milestone_title: str
    narrative_evolution: str
    recruiter_visibility_score: float
    leverage_accumulated: float
    consistency_rate: float

class OpportunityClusterModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    cluster_name: str
    target_specialization: str
    compound_leverage_multiplier: float
    recruiter_pull_index: float  # Index 0-100
    market_demand_index: float   # Index 0-100
    leverage_roadmap_skills: List[str]
    synthesis_description: str

class RiskBriefingModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    stagnation_coefficient: float  # 0.0 to 1.0
    risk_factor_level: str          # CRITICAL, HIGH, MEDIUM, LOW
    diagnostics_brief: str
    active_risk_triggers: List[str]
    reconstruction_actions: List[str]

class WeeklyDigestModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    trajectory_summary: str
    execution_delta: float           # week-over-week % diff
    opportunity_changes: str
    risk_changes: str
    confidence_transitions: str
    leverage_shift: str
    strategic_focus_recommendation: str

class NarrativeBriefModel(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    current_positioning: str
    strongest_leverage_direction: str
    execution_trajectory: str
    opportunity_pressure: str
    market_alignment: str
    recruiter_positioning: str
    strategic_weaknesses: str
