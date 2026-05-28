import json
import logging
import re
from typing import Dict, Any, Type
from pydantic import BaseModel
from app.services.llm.validators.output_sanitizer import sanitize_json_string

logger = logging.getLogger(__name__)

def validate_and_repair_json(raw_text: str, schema: Type[BaseModel], fallback: Dict[str, Any]) -> Dict[str, Any]:
    """Parse, clean, and validate raw LLM string into strict target schema. Auto-repairs simple issues."""
    if not raw_text:
        return fallback

    # 1. Clean markdown JSON code wrappers and preambles
    cleaned = sanitize_json_string(raw_text)
    
    # 2. Repair common JSON issues (trailing commas, missing closing brackets)
    # Simple trailing comma fix inside arrays/objects
    cleaned = re.sub(r',(\s*[\]\}])', r'\1', cleaned)

    # Missing unclosed brackets check
    open_braces = cleaned.count('{')
    close_braces = cleaned.count('}')
    if open_braces > close_braces:
        cleaned += '}' * (open_braces - close_braces)
        
    open_brackets = cleaned.count('[')
    close_brackets = cleaned.count(']')
    if open_brackets > close_brackets:
        cleaned += ']' * (open_brackets - close_brackets)

    try:
        parsed = json.loads(cleaned)
        # Handle case where LLM wraps root inside schema key
        if "resume" in parsed and isinstance(parsed["resume"], dict) and "skills" not in parsed:
            parsed = parsed["resume"]
            
        # Pydantic validation pass
        schema.model_validate(parsed)
        return parsed
    except Exception as e:
        logger.error(f"Structured JSON validation failed: {e}. Output text was: {raw_text[:200]}")
        return fallback
