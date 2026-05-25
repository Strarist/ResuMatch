"""Skill normalization — canonical names for technology aliases.

Maps common variations to a single canonical form.
Applied after AI extraction to ensure consistent matching.
"""

# Canonical skill name → list of aliases (lowercase)
_ALIASES: dict[str, list[str]] = {
    "JavaScript": ["js", "javascript", "ecmascript", "es6", "es2015"],
    "TypeScript": ["ts", "typescript"],
    "React": ["reactjs", "react.js", "react js"],
    "Next.js": ["nextjs", "next.js", "next js"],
    "Node.js": ["nodejs", "node.js", "node js", "node"],
    "Python": ["python3", "python 3", "py"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django"],
    "Flask": ["flask"],
    "PostgreSQL": ["postgres", "postgresql", "psql", "pg"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "Docker": ["docker", "containerization"],
    "Kubernetes": ["kubernetes", "k8s"],
    "AWS": ["aws", "amazon web services"],
    "GCP": ["gcp", "google cloud", "google cloud platform"],
    "Azure": ["azure", "microsoft azure"],
    "Git": ["git", "github", "gitlab"],
    "CI/CD": ["ci/cd", "cicd", "ci cd", "continuous integration"],
    "REST API": ["rest", "restful", "rest api", "restful api"],
    "GraphQL": ["graphql", "graph ql"],
    "SQL": ["sql", "structured query language"],
    "NoSQL": ["nosql", "no-sql"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
    "Vue.js": ["vue", "vuejs", "vue.js"],
    "Angular": ["angular", "angularjs"],
    "Express.js": ["express", "expressjs", "express.js"],
    "Spring Boot": ["spring boot", "springboot", "spring"],
    "Java": ["java"],
    "C#": ["c#", "csharp", "c sharp"],
    ".NET": [".net", "dotnet", "dot net"],
    "Go": ["go", "golang"],
    "Rust": ["rust"],
    "Machine Learning": ["ml", "machine learning"],
    "Deep Learning": ["dl", "deep learning"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch", "torch"],
    "NLP": ["nlp", "natural language processing"],
    "Agile": ["agile", "scrum", "kanban"],
}

# Build reverse lookup: lowercase alias → canonical name
_LOOKUP: dict[str, str] = {}
for canonical, aliases in _ALIASES.items():
    _LOOKUP[canonical.lower()] = canonical
    for alias in aliases:
        _LOOKUP[alias.lower()] = canonical


def normalize_skill(skill: str) -> str:
    """Normalize a single skill to its canonical form."""
    return _LOOKUP.get(skill.lower().strip(), skill.strip())


def normalize_skills(skills: list[str]) -> list[str]:
    """Normalize and deduplicate a list of skills."""
    seen: set[str] = set()
    result: list[str] = []
    for skill in skills:
        normalized = normalize_skill(skill)
        key = normalized.lower()
        if key not in seen:
            seen.add(key)
            result.append(normalized)
    return result
