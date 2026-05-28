"""Text cleaner for resume parser preprocessing.

Normalizes whitespaces, sanitizes unicode text, and filters out noise
like recurring headers/footers or system artifacts.
"""
import re

def clean_resume_text(text: str) -> str:
    """Normalize whitespace, remove non-printable characters, and clean headers/footers."""
    if not text:
        return ""
        
    # 1. Decode bytes if input is byte-based or replace non-unicode symbols
    cleaned = text.encode("utf-8", "ignore").decode("utf-8", "ignore")
    
    # 2. Normalize tabs and page separation symbols
    cleaned = cleaned.replace("\t", " ").replace("\r", "\n")
    
    # 3. Strip common PDF page breaks and redundant system noise
    cleaned = re.sub(r'\x0c', '\n', cleaned)  # Form feed characters
    
    # 4. Remove recurring page header/footer markers (e.g. Page X of Y, Resume template, etc.)
    cleaned = re.sub(r'(?i)page\s+\d+\s+of\s+\d+', '', cleaned)
    cleaned = re.sub(r'(?i)page\s+\d+', '', cleaned)
    
    # 5. Collapse multiple empty lines and excessive spaces
    lines = [line.strip() for line in cleaned.splitlines()]
    # Keep non-empty lines, or limit empty lines to single gaps
    cleaned_lines = []
    for line in lines:
        if line:
            # Collapse multiple spaces inside the line
            cleaned_line = re.sub(r'\s+', ' ', line)
            cleaned_lines.append(cleaned_line)
            
    return "\n".join(cleaned_lines)
