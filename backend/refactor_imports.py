import os
from app.logger import logger

MAPPINGS = {
    "Base": "app.models.base",
    "User": "app.models.user",
    "OnboardingState": "app.models.user",
    "Resume": "app.models.resume",
    "Job": "app.models.opportunity",
    "Match": "app.models.opportunity",
    "SanitizationStatus": "app.models.audit",
    "FileSanitizationAudit": "app.models.audit",
    "CareerMemorySnapshot": "app.models.memory",
    "BehavioralPattern": "app.models.memory",
    "StrategicEvolutionRecord": "app.models.memory",
    "IntelligenceExplanation": "app.models.memory"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find `from app.models import A, B, C`
    pattern = re.compile(r'^(\s*)from app\.models import (.*?)$', re.MULTILINE)

    def replacer(match):
        indent = match.group(1)
        imports_str = match.group(2)
        imports = [x.strip() for x in imports_str.split(',')]

        # Group by target module
        grouped = {}
        for imp in imports:
            target = MAPPINGS.get(imp)
            if target:
                grouped.setdefault(target, []).append(imp)
            else:
                # If not in mapping, leave it as is or fallback
                grouped.setdefault("app.models.UNKNOWN", []).append(imp)

        lines = []
        for target, imps in grouped.items():
            lines.append(f"{indent}from {target} import {', '.join(imps)}")
        return '\n'.join(lines)

    new_content = pattern.sub(replacer, content)

    # Also find `from app.models.strategic_memory import ...` etc just in case?
    # Not needed, we only want to change `from app.models import`

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        logger.info(f"Refactored: {filepath}")

def main():
    backend_dir = r"d:\ResuMatch\backend"
    for root, dirs, files in os.walk(backend_dir):
        # skip venv, __pycache__ etc
        if "venv" in root or "__pycache__" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                process_file(filepath)

if __name__ == "__main__":
    main()
