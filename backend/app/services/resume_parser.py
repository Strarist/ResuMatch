from typing import Dict, List, Optional
import spacy
from pydantic import BaseModel
import pdfminer.high_level
import docx
from pathlib import Path
import re
from datetime import datetime

class ParsedResume(BaseModel):
    content: str
    education: List[Dict[str, str]]
    experience: List[Dict[str, str]]
    current_role: Optional[str] = None
    total_years: float = 0.0

class Experience(BaseModel):
    current_role: Optional[str]
    total_years: float
    roles: List[Dict[str, str]]

class ResumeParser:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_lg")
        # Common education keywords
        self.education_keywords = {
            'university', 'college', 'institute', 'school', 'bachelor', 
            'master', 'phd', 'degree', 'diploma', 'certificate'
        }
        # Common date patterns
        self.date_patterns = [
            r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b',
            r'\b\d{4}\b',
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b'
        ]

    async def parse_file(self, file_path: str) -> ParsedResume:
        """Parse resume file (PDF or DOCX) and extract structured data."""
        ext = Path(file_path).suffix.lower()
        
        # Extract text based on file type
        if ext == '.pdf':
            text = self._extract_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            text = self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
            
        # Clean and structure the text
        cleaned_text = self._clean_text(text)
        
        # Extract structured data
        education = await self._extract_education(cleaned_text)
        experience = await self._extract_experience(cleaned_text)
        
        return ParsedResume(
            content=cleaned_text,
            education=education,
            experience=experience.roles,
            current_role=experience.current_role,
            total_years=experience.total_years
        )

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file."""
        try:
            return pdfminer.high_level.extract_text(file_path)
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}")

    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            doc = docx.Document(file_path)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        except Exception as e:
            raise ValueError(f"Error extracting text from DOCX: {str(e)}")

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text."""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep periods and commas
        text = re.sub(r'[^\w\s.,]', ' ', text)
        # Normalize spaces
        text = ' '.join(text.split())
        return text

    async def _extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information from text."""
        doc = self.nlp(text)
        education_entries = []
        
        # Split text into lines
        lines = text.split('\n')
        current_entry = {}
        
        for line in lines:
            # Check if line contains education keywords
            if any(keyword in line.lower() for keyword in self.education_keywords):
                if current_entry:
                    education_entries.append(current_entry)
                current_entry = {
                    'institution': line.strip(),
                    'degree': '',
                    'year': ''
                }
            elif current_entry:
                # Try to extract degree and year
                if not current_entry['degree'] and any(word in line.lower() for word in ['bachelor', 'master', 'phd', 'degree']):
                    current_entry['degree'] = line.strip()
                elif not current_entry['year'] and re.search(r'\b\d{4}\b', line):
                    current_entry['year'] = re.search(r'\b\d{4}\b', line).group()
        
        if current_entry:
            education_entries.append(current_entry)
            
        return education_entries

    async def extract_experience(self, text: str) -> Experience:
        """Extract work experience information from text."""
        doc = self.nlp(text)
        experience_entries = []
        current_role = None
        total_years = 0.0
        
        # Split text into sections
        sections = re.split(r'\n\s*\n', text)
        
        for section in sections:
            # Look for date patterns
            dates = []
            for pattern in self.date_patterns:
                dates.extend(re.findall(pattern, section))
            
            if len(dates) >= 2:  # Potential experience entry
                # Extract role and company
                lines = section.split('\n')
                role = lines[0].strip() if lines else ''
                company = lines[1].strip() if len(lines) > 1 else ''
                
                # Calculate duration if we have dates
                if len(dates) >= 2:
                    try:
                        start_date = self._parse_date(dates[0])
                        end_date = self._parse_date(dates[-1])
                        if start_date and end_date:
                            duration = (end_date - start_date).days / 365.25
                            total_years += duration
                    except:
                        pass
                
                entry = {
                    'role': role,
                    'company': company,
                    'start_date': dates[0] if dates else '',
                    'end_date': dates[-1] if len(dates) > 1 else 'Present'
                }
                experience_entries.append(entry)
                
                # Set current role if it's the most recent entry
                if not current_role and 'Present' in entry.get('end_date', ''):
                    current_role = role
        
        return Experience(
            current_role=current_role,
            total_years=round(total_years, 1),
            roles=experience_entries
        )

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string into datetime object."""
        try:
            # Try different date formats
            formats = [
                '%B %Y',  # January 2020
                '%b %Y',  # Jan 2020
                '%Y'      # 2020
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
                    
            return None
        except:
            return None 