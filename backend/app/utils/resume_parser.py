import spacy
import re
import json
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import PyPDF2
from io import BytesIO
import logging
from transformers import pipeline
import numpy as np
from sentence_transformers import SentenceTransformer
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeParser:
    def __init__(self):
        """Initialize the resume parser with NLP models"""
        try:
            # Load spaCy model for NER and text processing
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy model successfully")
        except OSError:
            logger.warning("spaCy model not found, installing...")
            os.system("python -m spacy download en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
        
        # Initialize sentence transformer for embeddings
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize text classification pipeline for skill detection
        self.classifier = pipeline(
            "text-classification",
            model="microsoft/DialoGPT-medium",
            return_all_scores=True
        )
        
        # Common skills database
        self.skills_db = self._load_skills_database()
        
    def _load_skills_database(self) -> Dict[str, List[str]]:
        """Load a comprehensive skills database"""
        return {
            "programming_languages": [
                "python", "javascript", "java", "c++", "c#", "php", "ruby", "go", "rust", "swift",
                "kotlin", "scala", "r", "matlab", "sql", "html", "css", "typescript", "dart"
            ],
            "frameworks": [
                "react", "angular", "vue", "node.js", "django", "flask", "spring", "express",
                "laravel", "rails", "asp.net", "fastapi", "next.js", "nuxt.js", "svelte"
            ],
            "databases": [
                "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
                "dynamodb", "sqlite", "oracle", "sql server", "firebase"
            ],
            "cloud_platforms": [
                "aws", "azure", "gcp", "heroku", "digitalocean", "vercel", "netlify",
                "docker", "kubernetes", "terraform", "ansible"
            ],
            "tools": [
                "git", "jenkins", "jira", "confluence", "slack", "figma", "sketch",
                "postman", "swagger", "maven", "gradle", "npm", "yarn"
            ],
            "methodologies": [
                "agile", "scrum", "kanban", "waterfall", "devops", "ci/cd", "tdd", "bdd"
            ]
        }
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text using multiple approaches"""
        skills = set()
        
        # Convert text to lowercase for matching
        text_lower = text.lower()
        
        # Method 1: Direct keyword matching
        for category, skill_list in self.skills_db.items():
            for skill in skill_list:
                if skill.lower() in text_lower:
                    skills.add(skill.lower())
        
        # Method 2: NLP-based extraction using spaCy
        doc = self.nlp(text)
        
        # Extract noun phrases that might be skills
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.lower().strip()
            if len(chunk_text) > 2 and len(chunk_text) < 20:
                # Check if it looks like a skill (contains common skill indicators)
                if any(indicator in chunk_text for indicator in ['script', 'sql', 'api', 'sdk', 'framework']):
                    skills.add(chunk_text)
        
        # Method 3: Pattern matching for technical terms
        patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Framework|Library|Tool|Platform|Language)\b',
            r'\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b',  # Acronyms like HTML CSS
            r'\b[a-z]+\.[a-z]+\b',  # dot notation like node.js
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                skills.add(match.lower())
        
        # Method 4: Extract from experience sections
        experience_patterns = [
            r'(?:worked with|used|developed|implemented|experience with)\s+([^.,]+)',
            r'(?:proficient in|expert in|skilled in)\s+([^.,]+)',
        ]
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Clean and split the match
                skills_text = match.strip()
                for skill in skills_text.split(','):
                    skill = skill.strip().lower()
                    if len(skill) > 2:
                        skills.add(skill)
        
        return list(skills)
    
    def extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information from resume text"""
        education = []
        
        # Common education keywords
        edu_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university', 'college',
            'school', 'institute', 'academy', 'b.s.', 'm.s.', 'ph.d.', 'ba', 'ma'
        ]
        
        # Split text into sentences
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(keyword in sentence_lower for keyword in edu_keywords):
                # Extract degree and institution
                degree_match = re.search(r'\b(bachelor|master|phd|doctorate|ba|ma|b\.s\.|m\.s\.|ph\.d\.)\b', sentence_lower)
                if degree_match:
                    education.append({
                        'degree': degree_match.group(1),
                        'institution': sentence.strip(),
                        'year': self._extract_year(sentence)
                    })
        
        return education
    
    def extract_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience from resume text"""
        experience = []
        
        # Common job title patterns
        job_patterns = [
            r'(?:senior|junior|lead|principal|staff)?\s*(?:software engineer|developer|programmer|architect|manager|analyst|consultant)',
            r'(?:frontend|backend|fullstack|devops|data|ml|ai)\s*(?:engineer|developer)',
            r'(?:project|product|engineering|technical)\s*(?:manager|lead)',
        ]
        
        # Split text into sections
        sections = re.split(r'\n{2,}', text)
        
        for section in sections:
            for pattern in job_patterns:
                matches = re.findall(pattern, section, re.IGNORECASE)
                for match in matches:
                    if match:
                        experience.append({
                            'title': match.strip(),
                            'description': section[:200] + '...' if len(section) > 200 else section,
                            'duration': self._extract_duration(section)
                        })
        
        return experience
    
    def _extract_year(self, text: str) -> Optional[str]:
        """Extract year from text"""
        year_match = re.search(r'\b(19|20)\d{2}\b', text)
        return year_match.group(0) if year_match else None
    
    def _extract_duration(self, text: str) -> Optional[str]:
        """Extract duration from text"""
        duration_patterns = [
            r'\b(\d{4})\s*-\s*(\d{4}|\bpresent\b)',
            r'\b(\d{1,2})\s*(?:years?|months?)\b',
        ]
        
        for pattern in duration_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None
    
    def calculate_skill_confidence(self, skill: str, text: str) -> float:
        """Calculate confidence score for a skill based on context"""
        text_lower = text.lower()
        skill_lower = skill.lower()
        
        # Count occurrences
        occurrences = text_lower.count(skill_lower)
        
        # Check for skill-related context
        context_indicators = [
            'experience with', 'proficient in', 'expert in', 'skilled in',
            'worked with', 'used', 'developed', 'implemented', 'built'
        ]
        
        context_score = 0
        for indicator in context_indicators:
            if indicator in text_lower and skill_lower in text_lower:
                context_score += 1
        
        # Calculate final confidence (0-1)
        base_score = min(occurrences * 0.3, 1.0)
        context_bonus = min(context_score * 0.2, 0.5)
        
        return min(base_score + context_bonus, 1.0)
    
    def parse_resume(self, pdf_path: str) -> Dict:
        """Main method to parse a resume and extract all information"""
        try:
            # Extract text from PDF
            text = self.extract_text_from_pdf(pdf_path)
            
            # Extract different components
            skills = self.extract_skills(text)
            education = self.extract_education(text)
            experience = self.extract_experience(text)
            
            # Calculate skill confidence scores
            skill_scores = {}
            for skill in skills:
                confidence = self.calculate_skill_confidence(skill, text)
                skill_scores[skill] = confidence
            
            # Generate embeddings for skills
            skill_embeddings = {}
            if skills:
                skill_texts = list(skills)
                embeddings = self.embedding_model.encode(skill_texts)
                for i, skill in enumerate(skill_texts):
                    skill_embeddings[skill] = embeddings[i].tolist()
            
            return {
                'text_content': text,
                'skills': skills,
                'skill_scores': skill_scores,
                'skill_embeddings': skill_embeddings,
                'education': education,
                'experience': experience,
                'metadata': {
                    'word_count': len(text.split()),
                    'char_count': len(text),
                    'skills_count': len(skills),
                    'education_count': len(education),
                    'experience_count': len(experience)
                }
            }
            
        except Exception as e:
            logger.error(f"Error parsing resume: {e}")
            raise

# Global instance for reuse
resume_parser = ResumeParser() 