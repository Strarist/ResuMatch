from typing import Dict, List, Any, Optional
import spacy
from transformers import pipeline
import re
from app.models.resume import Resume
from app.services.resume import calculate_match_score
from app.core.logging import logger

# Load spaCy model for NLP tasks
nlp = spacy.load("en_core_web_sm")

# Lazy load the classifier
_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        try:
            _classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
        except Exception as e:
            logger.error(f"Error loading classifier: {e}")
            # Return a dummy classifier for testing/offline mode
            def dummy_classifier(*args, **kwargs):
                return [{"label": "POSITIVE", "score": 0.9}]
            _classifier = dummy_classifier
    return _classifier

# Common job requirements and keywords
REQUIREMENT_KEYWORDS = [
    "required", "requirements", "qualifications", "skills", "experience",
    "must have", "should have", "looking for", "seeking", "candidate should"
]

# Job level indicators
JOB_LEVELS = {
    "entry": ["entry level", "junior", "graduate", "intern", "internship"],
    "mid": ["mid level", "intermediate", "experienced"],
    "senior": ["senior", "lead", "principal", "architect"],
    "management": ["manager", "director", "head", "chief", "vp", "cto", "ceo"]
}

# Job type indicators
JOB_TYPES = {
    "full_time": ["full time", "full-time", "permanent"],
    "part_time": ["part time", "part-time"],
    "contract": ["contract", "contractor", "freelance"],
    "internship": ["internship", "intern"],
    "remote": ["remote", "work from home", "wfh"]
}


async def analyze_job(text: str) -> Dict[str, Any]:
    """
    Analyze job posting to extract structured information
    """
    # Convert text to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Extract requirements
    requirements = []
    doc = nlp(text)
    
    # Find requirement sections
    requirement_sections = []
    current_section = []
    
    for sent in doc.sents:
        sent_text = sent.text.lower()
        if any(keyword in sent_text for keyword in REQUIREMENT_KEYWORDS):
            if current_section:
                requirement_sections.append(" ".join(current_section))
                current_section = []
            current_section.append(sent.text)
        elif current_section:
            current_section.append(sent.text)
    
    if current_section:
        requirement_sections.append(" ".join(current_section))
    
    # Extract skills and requirements from sections
    for section in requirement_sections:
        section_doc = nlp(section)
        
        # Extract technical skills
        for ent in section_doc.ents:
            if ent.label_ in ["ORG", "PRODUCT"]:
                requirements.append(ent.text.lower())
        
        # Extract bullet points and requirements
        for sent in section_doc.sents:
            # Look for bullet points
            if sent.text.strip().startswith(("•", "-", "*")):
                requirements.append(sent.text.strip()[1:].strip().lower())
            # Look for numbered requirements
            elif re.match(r'^\d+[\.\)]', sent.text.strip()):
                requirements.append(sent.text.strip()[2:].strip().lower())
    
    # Determine job level
    job_level = None
    for level, keywords in JOB_LEVELS.items():
        if any(keyword in text_lower for keyword in keywords):
            job_level = level
            break
    
    # Determine job type
    job_type = None
    for type_, keywords in JOB_TYPES.items():
        if any(keyword in text_lower for keyword in keywords):
            job_type = type_
            break
    
    # Extract years of experience required
    experience_required = 0
    experience_patterns = [
        r'(\d+)\+?\s*years?\s+of\s+experience',
        r'experience:\s*(\d+)\+?\s*years?',
        r'(\d+)\+?\s*years?\s+in\s+the\s+field'
    ]
    
    for pattern in experience_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                years = int(match.group(1))
                experience_required = max(experience_required, years)
            except ValueError:
                continue
    
    return {
        "requirements": list(set(requirements)),  # Remove duplicates
        "job_level": job_level,
        "job_type": job_type,
        "experience_required": experience_required
    }


async def match_resumes(job: Any, resumes: List[Resume]) -> List[Dict[str, Any]]:
    """
    Match resumes with a job posting
    """
    matches = []
    
    # Analyze job requirements if not already done
    if not job.requirements:
        analysis = await analyze_job(job.description)
        job.requirements = analysis["requirements"]
    
    for resume in resumes:
        # Calculate skill match score
        skill_score = await calculate_match_score(resume.skills, job.requirements)
        
        # Calculate experience match score
        experience_score = 0.0
        if job.experience_required and resume.experience:
            experience_score = min(1.0, resume.experience / job.experience_required)
        
        # Calculate overall match score (weighted average)
        overall_score = (skill_score * 0.7) + (experience_score * 0.3)
        
        matches.append({
            "resume_id": resume.id,
            "score": overall_score,
            "skill_score": skill_score,
            "experience_score": experience_score,
            "matching_skills": list(set(resume.skills).intersection(set(job.requirements))),
            "missing_skills": list(set(job.requirements) - set(resume.skills))
        })
    
    # Sort matches by overall score in descending order
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    return matches 