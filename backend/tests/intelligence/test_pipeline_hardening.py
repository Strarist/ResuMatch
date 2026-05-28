"""Hardening Test Suite for ResuMatch Intelligence Layer.

Verifies JSON repairs, skill canonicalization, hallucination screening,
modularized opportunities scoring models, and strategic memory context engines.
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from pydantic import BaseModel, Field
from typing import List

# Import LLM output validators
from app.services.llm.validators.json_validator import validate_and_repair_json
from app.services.llm.validators.output_sanitizer import sanitize_json_string
from app.services.llm.validators.skill_normalizer import normalize_skill_name, normalize_skill_list
from app.services.llm.validators.hallucination_filter import is_hallucinated_skill, filter_hallucinations

# Import Resume Pipeline normalizers
from app.services.resume_pipeline.normalization.text_cleaner import clean_resume_text
from app.services.resume_pipeline.normalization.duplicate_filter import filter_duplicate_skills
from app.services.resume_pipeline.normalization.confidence_ranker import evaluate_extraction_confidence, assign_skill_confidence_weights

# Import Opportunities Engine scorers
from app.services.opportunity_engine.scoring.compatibility_score import calculate_compatibility_score
from app.services.opportunity_engine.scoring.market_weighting import calculate_market_demand_weight
from app.services.opportunity_engine.scoring.specialization_matcher import evaluate_specialization_fit
from app.services.opportunity_engine.scoring.recruiter_alignment import evaluate_recruiter_alignment

# Import Strategic Memory
from app.services.copilot.context_memory import CopilotContextMemory


# Simple schema for json parsing validation
class DummySchema(BaseModel):
    skills: List[str] = Field(default_factory=list)
    years_of_experience: float = 0.0


# ==========================================
# 1. JSON Parser & Sanitizer Tests
# ==========================================

def test_json_sanitization_and_repair():
    # Test chat preamble, postscript and markdown strip
    raw_text = """
    Here is the JSON you requested:
    ```json
    {
        "skills": ["Python", "FastAPI", "Docker"],
        "years_of_experience": 5.5,
    }
    ```
    I hope this is helpful!
    """
    
    fallback = {"skills": [], "years_of_experience": 0.0}
    result = validate_and_repair_json(raw_text, DummySchema, fallback)
    
    assert "Python" in result["skills"]
    assert result["years_of_experience"] == 5.5
    
    # Test unclosed brackets/braces repair
    raw_broken = '{"skills": ["React", "TypeScript"], "years_of_experience": 3.0'
    result_broken = validate_and_repair_json(raw_broken, DummySchema, fallback)
    assert "React" in result_broken["skills"]
    assert result_broken["years_of_experience"] == 3.0


# ==========================================
# 2. Skill Normalization & Taxonomy Tests
# ==========================================

def test_skill_normalization_taxonomy():
    assert normalize_skill_name("k8s") == "Kubernetes"
    assert normalize_skill_name("js") == "JavaScript"
    assert normalize_skill_name("node.js") == "Node.js"
    assert normalize_skill_name("reactjs") == "React"
    
    raw_list = ["k8s", "Docker", "kubernetes", "DOCKER", "fastapi", "FastAPI"]
    norm_list = normalize_skill_list(raw_list)
    
    # Check deduplication and taxonomy mapping
    assert len(norm_list) == 3
    assert norm_list[0] == "Kubernetes"
    assert norm_list[1] == "Docker"
    assert norm_list[2] == "FastAPI"


# ==========================================
# 3. Hallucination Filtering Tests
# ==========================================

def test_hallucination_filtering():
    # Test fake speculative technologies
    assert is_hallucinated_skill("omega-protocol-engine") is True
    assert is_hallucinated_skill("cyber-mesh-sync") is True
    assert is_hallucinated_skill("llama-infinity-framework") is True
    assert is_hallucinated_skill("this-is-an-extremely-long-hallucinated-technology-sentence-tag-here") is True
    
    # Test genuine skills are NOT filtered
    assert is_hallucinated_skill("React") is False
    assert is_hallucinated_skill("Kubernetes") is False
    assert is_hallucinated_skill("PyTorch") is False
    
    skills = ["React", "omega-protocol-engine", "Docker", "cyber-mesh-sync"]
    filtered = filter_hallucinations(skills)
    assert len(filtered) == 2
    assert "React" in filtered
    assert "Docker" in filtered


# ==========================================
# 4. Resume Text Cleaner & Confidence Tests
# ==========================================

def test_resume_text_cleaning_and_evidence():
    noisy_text = """
    Page 1 of 2
    John Doe Resume
    
    - Created React Apps
    - Configured Docker pipelines.
    
    Page 2 of 2
    Contact: email@domain.com
    """
    cleaned = clean_resume_text(noisy_text)
    assert "Page 1 of 2" not in cleaned
    assert "Page 2 of 2" not in cleaned
    
    # Test duplicate list filter
    raw_skills = ["React", "", "Docker", "React", "Docker "]
    assert filter_duplicate_skills(raw_skills) == ["React", "Docker"]
    
    # Test extraction confidence index
    complete_data = {
        "metadata": {"name": "John", "email": "john@doe.com", "phone": "123"},
        "skills": ["React", "Docker"],
        "experience": [{"title": "Dev"}],
        "projects": [{"name": "ResuMatch"}]
    }
    confidence = evaluate_extraction_confidence(complete_data)
    assert confidence > 0.5
    
    # Test structural evidence check
    skills = ["React", "Docker", "Kubernetes"]
    exp = [{"description": "Created frontends in React"}]
    proj = [{"technology_stack": ["Docker"]}]
    weights = assign_skill_confidence_weights(skills, exp, proj)
    
    assert weights["React"] == 0.90      # Work experience validated
    assert weights["Docker"] == 0.85     # Project validated
    assert weights["Kubernetes"] == 0.75 # Self-reported only


# ==========================================
# 5. Opportunity Scorer Engine Tests
# ==========================================

def test_opportunity_matching_engine_scorers():
    # Skill overlap
    candidate = ["Python", "React", "Docker"]
    required = ["Python", "Docker", "Kubernetes"]
    score = calculate_compatibility_score(candidate, required)
    assert score == pytest.approx(0.666, 0.01)
    
    # Market weight
    opp_high = {"urgency": "high", "stackCompatibility": "React, Kubernetes", "recruiterPressure": "high"}
    opp_low = {"urgency": "low", "stackCompatibility": "COBOL", "recruiterPressure": "low"}
    assert calculate_market_demand_weight(opp_high) > calculate_market_demand_weight(opp_low)
    
    # Specialization fit
    fit_full = evaluate_specialization_fit("React & Node Ecosystems", "Senior React Developer", "React, Node.js")
    assert fit_full == 1.0 or fit_full > 0.70
    
    # Recruiter alignment projects check
    opp = {
        "missingRequirements": ["Kubernetes"],
        "proofGaps": ["FastAPI endpoints benchmarks"],
        "stackCompatibility": "React, Docker"
    }
    projects = [
        {"technology_stack": ["React", "Docker"]}
    ]
    alignment = evaluate_recruiter_alignment(opp, projects)
    assert alignment > 0.40


# ==========================================
# 6. Strategic Memory Tests
# ==========================================

@pytest.mark.asyncio
async def test_strategic_copilot_memory():
    # Mocking sqlalchemy AsyncSession and profile structure
    db_mock = AsyncMock()
    profile_mock = MagicMock()
    profile_mock.target_role = "Staff AI Engineer"
    profile_mock.active_specialization = "Large Models & GPU Infrastructure"
    profile_mock.inferred_skills = ["PyTorch", "CUDA"]
    profile_mock.opportunity_alignment = [{}, {}]
    profile_mock.recruiter_signals = {
        "roleFit": [
            {
                "missing": ["vLLM optimization"]
            }
        ]
    }
    
    # Mock return values for DB scalar execution
    scalar_result = MagicMock()
    scalar_result.scalar_one_or_none.return_value = profile_mock
    db_mock.execute.return_value = scalar_result
    
    # Test load context memory
    memory = await CopilotContextMemory.get_context(db_mock, "user_123")
    assert memory["target_role"] == "Staff AI Engineer"
    assert memory["specialization"] == "Large Models & GPU Infrastructure"
    assert "PyTorch" in memory["validated_skills"]
    assert "vLLM optimization" in memory["gaps"]
    
    # Test update context memory
    success = await CopilotContextMemory.save_context(
        db_mock, 
        user_id="user_123", 
        target_role="Principal ML Architect"
    )
    assert success is True
    assert profile_mock.target_role == "Principal ML Architect"
