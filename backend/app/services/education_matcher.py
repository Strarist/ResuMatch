from typing import List, Dict, Optional, Tuple
import spacy
from dataclasses import dataclass
from enum import Enum
import re
from app.core.cache import Cache

class DegreeLevel(Enum):
    PHD = "phd"
    MASTERS = "masters"
    BACHELORS = "bachelors"
    ASSOCIATE = "associate"
    DIPLOMA = "diploma"
    CERTIFICATE = "certificate"

@dataclass
class Education:
    degree: str
    field: str
    institution: str
    level: DegreeLevel
    year: Optional[int] = None
    gpa: Optional[float] = None
    is_relevant: bool = False

class EducationMatcher:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_lg")
        self.cache = Cache()
        
        # Degree level mappings
        self.degree_mappings = {
            'phd': ['phd', 'doctorate', 'd.phil', 'dr.'],
            'masters': ['masters', 'ms', 'ma', 'm.sc', 'm.tech', 'mba'],
            'bachelors': ['bachelors', 'bs', 'ba', 'b.sc', 'b.tech', 'b.e'],
            'associate': ['associate', 'aa', 'as', 'a.a.s'],
            'diploma': ['diploma', 'certificate', 'cert.'],
            'certificate': ['certificate', 'certification', 'cert.']
        }
        
        # Field of study mappings
        self.field_mappings = {
            'computer_science': [
                'computer science', 'cs', 'software engineering',
                'computer engineering', 'it', 'information technology'
            ],
            'data_science': [
                'data science', 'machine learning', 'artificial intelligence',
                'ai', 'ml', 'statistics', 'analytics'
            ],
            'business': [
                'business', 'management', 'mba', 'finance', 'marketing',
                'economics', 'accounting'
            ],
            'engineering': [
                'engineering', 'mechanical', 'electrical', 'civil',
                'chemical', 'industrial'
            ]
        }
        
        # Institution prestige tiers (optional)
        self.prestige_tiers = {
            'tier1': ['harvard', 'mit', 'stanford', 'oxford', 'cambridge'],
            'tier2': ['berkeley', 'cmu', 'georgia tech', 'umich'],
            'tier3': ['state universities', 'regional universities']
        }

    def _normalize_degree(self, degree: str) -> Tuple[DegreeLevel, str]:
        """Normalize degree level and field."""
        degree_lower = degree.lower()
        
        # Find degree level
        level = None
        for deg_level, patterns in self.degree_mappings.items():
            if any(pattern in degree_lower for pattern in patterns):
                level = DegreeLevel(deg_level)
                break
        
        if not level:
            # Default to bachelors if unclear
            level = DegreeLevel.BACHELORS
        
        # Extract field of study
        field = None
        for field_key, patterns in self.field_mappings.items():
            if any(pattern in degree_lower for pattern in patterns):
                field = field_key
                break
        
        if not field:
            # Try to extract field using NLP
            doc = self.nlp(degree)
            for ent in doc.ents:
                if ent.label_ in ['ORG', 'PRODUCT']:
                    field = ent.text.lower()
                    break
        
        return level, field or 'other'

    def _extract_education(self, text: str) -> List[Education]:
        """Extract education information from text."""
        educations = []
        
        # Split into potential education sections
        sections = re.split(r'\n|\r\n|;', text)
        
        for section in sections:
            if not any(degree in section.lower() for patterns in self.degree_mappings.values() for degree in patterns):
                continue
            
            # Extract year if present
            year_match = re.search(r'\b(19|20)\d{2}\b', section)
            year = int(year_match.group()) if year_match else None
            
            # Extract GPA if present
            gpa_match = re.search(r'\b\d\.\d{1,2}\b', section)
            gpa = float(gpa_match.group()) if gpa_match else None
            
            # Extract institution
            doc = self.nlp(section)
            institution = None
            for ent in doc.ents:
                if ent.label_ == 'ORG':
                    institution = ent.text
                    break
            
            # Normalize degree
            level, field = self._normalize_degree(section)
            
            educations.append(Education(
                degree=section.strip(),
                field=field,
                institution=institution or 'Unknown',
                level=level,
                year=year,
                gpa=gpa
            ))
        
        return educations

    def _calculate_field_relevance(self, field: str, job_description: str) -> float:
        """Calculate relevance of education field to job description."""
        if field == 'other':
            return 0.5
        
        # Get field variations
        field_variations = self.field_mappings.get(field, [field])
        
        # Calculate semantic similarity
        field_doc = self.nlp(' '.join(field_variations))
        job_doc = self.nlp(job_description)
        
        return field_doc.similarity(job_doc)

    def _calculate_level_match(self, required_level: DegreeLevel, actual_level: DegreeLevel) -> float:
        """Calculate match score based on degree levels."""
        level_values = {
            DegreeLevel.PHD: 5,
            DegreeLevel.MASTERS: 4,
            DegreeLevel.BACHELORS: 3,
            DegreeLevel.ASSOCIATE: 2,
            DegreeLevel.DIPLOMA: 1,
            DegreeLevel.CERTIFICATE: 0
        }
        
        required_value = level_values[required_level]
        actual_value = level_values[actual_level]
        
        if actual_value >= required_value:
            return 1.0
        return actual_value / required_value

    async def analyze_education_match(
        self,
        resume_text: str,
        job_description: str,
        required_education: Optional[Dict] = None
    ) -> Dict:
        """Analyze education match between resume and job."""
        # Extract education from resume
        educations = self._extract_education(resume_text)
        
        if not educations:
            return {
                'match_score': 0.0,
                'level_match': 0.0,
                'field_relevance': 0.0,
                'highest_degree': None,
                'relevant_education': [],
                'missing_requirements': [],
                'suggestions': ['Add your educational background to improve match']
            }
        
        # Sort by level (highest first)
        educations.sort(key=lambda x: x.level.value, reverse=True)
        highest_education = educations[0]
        
        # Calculate field relevance
        field_relevance = self._calculate_field_relevance(
            highest_education.field,
            job_description
        )
        
        # Calculate level match if required education is specified
        level_match = 1.0
        if required_education:
            required_level = DegreeLevel(required_education.get('level', 'bachelors'))
            level_match = self._calculate_level_match(
                required_level,
                highest_education.level
            )
        
        # Mark relevant education
        for edu in educations:
            edu.is_relevant = (
                edu.field in self.field_mappings and
                self._calculate_field_relevance(edu.field, job_description) > 0.7
            )
        
        # Calculate overall match score
        match_score = (level_match * 0.6 + field_relevance * 0.4)
        
        # Generate suggestions
        suggestions = []
        if level_match < 0.8 and required_education:
            suggestions.append(
                f"Consider highlighting your {highest_education.level.value} degree more prominently"
            )
        if field_relevance < 0.7:
            suggestions.append(
                "Emphasize how your education relates to the job requirements"
            )
        
        # Identify missing requirements
        missing_requirements = []
        if required_education:
            if level_match < 1.0:
                missing_requirements.append(
                    f"Required: {required_education.get('level', 'bachelors')} degree"
                )
            if required_education.get('field') and field_relevance < 0.7:
                missing_requirements.append(
                    f"Preferred field: {required_education.get('field')}"
                )
        
        return {
            'match_score': float(match_score),
            'level_match': float(level_match),
            'field_relevance': float(field_relevance),
            'highest_degree': {
                'level': highest_education.level.value,
                'field': highest_education.field,
                'institution': highest_education.institution,
                'year': highest_education.year
            },
            'relevant_education': [
                {
                    'degree': edu.degree,
                    'field': edu.field,
                    'institution': edu.institution,
                    'year': edu.year,
                    'gpa': edu.gpa,
                    'is_relevant': edu.is_relevant
                }
                for edu in educations
            ],
            'missing_requirements': missing_requirements,
            'suggestions': suggestions
        } 