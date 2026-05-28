"""Output sanitizer for central LLM validator layer.

Strips away chat preambles, markdown code wraps, conversational greetings, and
postscripts to isolate pure structured JSON or text data payload.
"""
import re

def sanitize_json_string(raw_text: str) -> str:
    """Isolate and clean raw JSON substrings within a potentially noisy chat response.
    
    Removes:
    - Markdown block wraps (e.g. ```json ... ```)
    - Chat preambles (e.g. "Here is the analysis you requested:")
    - Chat postscripts (e.g. "Let me know if you need anything else!")
    """
    if not raw_text:
        return ""
        
    cleaned = raw_text.strip()
    
    # 1. Look for JSON block wraps: ```json ... ``` or ``` ... ```
    json_block_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if json_block_match:
        cleaned = json_block_match.group(1).strip()
    else:
        # If no markdown blocks, let's try to extract from the first '{' or '[' to the last '}' or ']'
        brace_start = cleaned.find('{')
        bracket_start = cleaned.find('[')
        
        start_idx = -1
        end_char = ''
        
        if brace_start != -1 and (bracket_start == -1 or brace_start < bracket_start):
            start_idx = brace_start
            end_char = '}'
        elif bracket_start != -1:
            start_idx = bracket_start
            end_char = ']'
            
        if start_idx != -1:
            end_idx = cleaned.rfind(end_char)
            if end_idx != -1 and end_idx > start_idx:
                cleaned = cleaned[start_idx:end_idx + 1].strip()

    return cleaned
