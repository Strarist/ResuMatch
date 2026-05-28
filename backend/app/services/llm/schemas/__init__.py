from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# === Resume Extraction Schemas ===

class ExtractionEducation(BaseModel):
    degree: str = ""
    institution: str = ""
    year: str = ""

class ExtractionExperience(BaseModel):
    title: str = ""
    company: str = ""
    duration: str = ""
    description: str = ""
    skills_used: List[str] = Field(default_factory=list)

class ExtractionProject(BaseModel):
    name: str = ""
    description: str = ""
    technology_stack: List[str] = Field(default_factory=list)
    role: str = ""

class ExtractionMetadata(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""

class ResumeExtractionSchema(BaseModel):
    skills: List[str] = Field(default_factory=list)
    education: List[ExtractionEducation] = Field(default_factory=list)
    experience: List[ExtractionExperience] = Field(default_factory=list)
    projects: List[ExtractionProject] = Field(default_factory=list)
    metadata: ExtractionMetadata = Field(default_factory=ExtractionMetadata)
    inferred_specialization: str = "Software Engineering"
    inferred_target_role: str = "Senior Engineer"
    years_of_experience: float = 0.0
    certifications: List[str] = Field(default_factory=list)


# === Roadmap Generation Schemas ===

class RoadmapMilestone(BaseModel):
    skill: str
    priority: str = "medium"  # high, medium, low
    effort_weeks: int = 4
    impact_estimate: int = 80
    reason: str = ""
    dependencies: List[str] = Field(default_factory=list)
    completionConfidence: int = 80
    projectedImpact: str = ""
    strategicRationale: str = ""

class RoadmapGenerationSchema(BaseModel):
    milestones: List[RoadmapMilestone] = Field(default_factory=list)


# === Opportunity Matching Schemas ===

class OpportunityMatchItem(BaseModel):
    title: str
    company: str
    alignmentScore: float = 0.5
    confidence: float = 0.5
    urgency: str = "medium"  # high, medium, low
    type: str = "Full-time / Remote"
    missingRequirements: List[str] = Field(default_factory=list)
    proofGaps: List[str] = Field(default_factory=list)
    compensation: str = "$120k - $150k"
    recruiterPressure: str = "medium"  # high, medium, low
    hiringWindow: str = "Closes in 7 days"
    stackCompatibility: str = ""
    alignmentReasoning: str = ""

class OpportunityMatchingSchema(BaseModel):
    matches: List[OpportunityMatchItem] = Field(default_factory=list)
