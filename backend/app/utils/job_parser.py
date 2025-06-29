import spacy
import re
from typing import List, Dict

# Use the same skills list as resume_parser for consistency
SKILLS = [
    "python", "java", "c++", "javascript", "typescript", "react", "node.js", "sql", "aws", "docker",
    "kubernetes", "tensorflow", "pytorch", "fastapi", "django", "flask", "git", "linux", "azure"
]

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import os
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

def extract_skills_from_jd(text: str) -> List[str]:
    text_lower = text.lower()
    found = set()
    for skill in SKILLS:
        if skill in text_lower:
            found.add(skill)
    # Optionally, use spaCy NER for more
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT"] and ent.text.lower() in SKILLS:
            found.add(ent.text.lower())
    return list(found)

def extract_education_from_jd(text: str) -> List[str]:
    degrees = re.findall(r"(bachelor|master|phd|b\\.sc|m\\.sc|ba|ma|bs|ms)", text, re.IGNORECASE)
    return list(set(degrees))

def extract_experience_from_jd(text: str) -> List[str]:
    # Look for years of experience requirements
    experience = re.findall(r"(\d+\+?\s*(?:years?|yrs?) of experience)", text, re.IGNORECASE)
    return list(set(experience))

def parse_job_description(text: str) -> Dict:
    return {
        "skills": extract_skills_from_jd(text),
        "education": extract_education_from_jd(text),
        "experience": extract_experience_from_jd(text)
    } 