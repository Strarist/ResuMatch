"""Skill Taxonomy for canonicalization across the ResuMatch intelligence engine.

Maps common tech aliases, acronyms, and variations to strict canonical names.
"""

# Canonical skill name to standard aliases mapping
CANONICAL_SKILL_ALIASES = {
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

# Reverse lookup dictionary: lowercase alias/variation -> canonical name
SKILL_TAXONOMY_LOOKUP = {}
for canonical, aliases in CANONICAL_SKILL_ALIASES.items():
    SKILL_TAXONOMY_LOOKUP[canonical.lower()] = canonical
    for alias in aliases:
        SKILL_TAXONOMY_LOOKUP[alias.lower()] = canonical

def get_canonical_skill(skill_name: str) -> str:
    """Return canonical skill form if exists, else return cleaned title case/standard form."""
    cleaned = skill_name.strip()
    lookup_key = cleaned.lower()
    return SKILL_TAXONOMY_LOOKUP.get(lookup_key, cleaned)
