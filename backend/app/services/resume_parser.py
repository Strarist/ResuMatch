import re
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
try:
    from pdfminer.high_level import extract_text
    from docx import Document
except ImportError:
    # Fallback for missing dependencies
    extract_text = None
    Document = None

logger = logging.getLogger(__name__)

class ResumeParser:
    def __init__(self) -> None:
        self.skill_patterns = [
            r'\b(python|java|javascript|react|angular|vue|node\.js|fastapi|django|flask)\b',
            r'\b(sql|postgresql|mysql|mongodb|redis)\b',
            r'\b(docker|kubernetes|aws|azure|gcp)\b',
            r'\b(git|jenkins|ci/cd|agile|scrum)\b'
        ]
        
    def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """Parse resume file and extract structured data"""
        try:
            # Extract text based on file type
            if file_path.lower().endswith('.pdf'):
                text = self._extract_pdf_text(file_path)
            elif file_path.lower().endswith('.docx'):
                text = self._extract_docx_text(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_path}")
            
            # Parse extracted text
            parsed_data = {
                'skills': self._extract_skills(text),
                'experience': self._extract_experience(text),
                'education': self._extract_education(text),
                'contact_info': self._extract_contact_info(text),
                'summary': self._extract_summary(text)
            }
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"Error parsing resume {file_path}: {e}")
            raise
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        if extract_text is None:
            raise ImportError("pdfminer is not installed")
        
        try:
            return extract_text(file_path)
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            return ""
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        if Document is None:
            raise ImportError("python-docx is not installed")
        
        try:
            doc = Document(file_path)
            return " ".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            return ""
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from text"""
        skills = set()
        text_lower = text.lower()
        
        for pattern in self.skill_patterns:
            matches = re.findall(pattern, text_lower)
            skills.update(matches)
        
        return list(skills)
    
    def _extract_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience from text"""
        experience_entries = []
        
        # Look for experience patterns
        experience_patterns = [
            r'(\d{4})\s*[-–]\s*(\d{4}|present).*?(senior|junior|lead|principal)?\s*(developer|engineer|manager|analyst)',
            r'(senior|junior|lead|principal)?\s*(developer|engineer|manager|analyst).*?(\d{4})\s*[-–]\s*(\d{4}|present)'
        ]
        
        for pattern in experience_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                current_entry: Dict[str, str] = {
                    'title': match.group(0),
                    'duration': f"{match.group(1)} - {match.group(2)}" if len(match.groups()) >= 2 else ""
                }
                experience_entries.append(current_entry)
        
        return experience_entries
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education information from text"""
        education = []
        
        # Look for degree patterns
        degree_patterns = [
            r'(bachelor|master|phd|doctorate).*?(science|arts|engineering|technology)',
            r'(b\.s\.|m\.s\.|ph\.d\.).*?(computer science|engineering|mathematics)'
        ]
        
        for pattern in degree_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                education.append(match.group(0))
        
        return education
    
    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information from text"""
        contact_info = {}
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            contact_info['email'] = email_match.group(0)
        
        # Extract phone
        phone_match = re.search(r'(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        if phone_match:
            contact_info['phone'] = phone_match.group(0)
        
        return contact_info
    
    def _extract_summary(self, text: str) -> str:
        """Extract summary/objective from text"""
        # Look for summary section
        summary_patterns = [
            r'summary[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)',
            r'objective[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)',
            r'profile[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        # Fallback: return first few sentences
        sentences = re.split(r'[.!?]+', text)
        return sentences[0] if sentences else "" 