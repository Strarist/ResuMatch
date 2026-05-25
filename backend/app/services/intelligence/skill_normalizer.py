"""Deterministic skill normalization. No LLM calls."""

_ALIASES: dict[str, str] = {
    "js": "JavaScript", "javascript": "JavaScript", "ecmascript": "JavaScript",
    "ts": "TypeScript", "typescript": "TypeScript",
    "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js",
    "react": "React", "reactjs": "React", "react.js": "React",
    "nextjs": "Next.js", "next.js": "Next.js", "next": "Next.js",
    "vue": "Vue.js", "vuejs": "Vue.js", "vue.js": "Vue.js",
    "angular": "Angular", "angularjs": "Angular",
    "python": "Python", "python3": "Python", "py": "Python",
    "fastapi": "FastAPI", "fast api": "FastAPI",
    "django": "Django", "flask": "Flask",
    "java": "Java", "kotlin": "Kotlin",
    "go": "Go", "golang": "Go",
    "rust": "Rust", "c#": "C#", "csharp": "C#",
    ".net": ".NET", "dotnet": ".NET",
    "postgres": "PostgreSQL", "postgresql": "PostgreSQL", "psql": "PostgreSQL",
    "mysql": "MySQL", "mongo": "MongoDB", "mongodb": "MongoDB",
    "redis": "Redis", "elasticsearch": "Elasticsearch",
    "docker": "Docker", "k8s": "Kubernetes", "kubernetes": "Kubernetes",
    "terraform": "Terraform", "helm": "Helm",
    "aws": "AWS", "gcp": "GCP", "azure": "Azure",
    "git": "Git", "github": "Git",
    "ci/cd": "CI/CD", "cicd": "CI/CD",
    "rest": "REST API", "restful": "REST API", "graphql": "GraphQL",
    "sql": "SQL", "nosql": "NoSQL",
    "html": "HTML", "css": "CSS", "tailwind": "Tailwind CSS",
    "ml": "Machine Learning", "machine learning": "Machine Learning",
    "dl": "Deep Learning", "deep learning": "Deep Learning",
    "nlp": "NLP", "natural language processing": "NLP",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch",
    "agile": "Agile", "scrum": "Agile",
}

_CLUSTERS: dict[str, list[str]] = {
    "frontend": ["JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular", "HTML", "CSS", "Tailwind CSS"],
    "backend": ["Python", "FastAPI", "Django", "Node.js", "Java", "Go", "Rust", "C#", ".NET"],
    "infrastructure": ["Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure", "CI/CD", "Helm"],
    "data": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQL", "NoSQL"],
    "ml": ["Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch"],
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill string to canonical form."""
    key = skill.lower().strip()
    return _ALIASES.get(key, skill.strip())


def normalize_skill_list(skills: list[str]) -> list[str]:
    """Normalize and deduplicate a skill list."""
    seen: set[str] = set()
    result: list[str] = []
    for s in skills:
        n = normalize_skill(s)
        if n.lower() not in seen:
            seen.add(n.lower())
            result.append(n)
    return result


def cluster_skills(skills: list[str]) -> dict[str, list[str]]:
    """Group normalized skills into domain clusters."""
    normalized = normalize_skill_list(skills)
    result: dict[str, list[str]] = {}
    for cluster_name, cluster_skills_list in _CLUSTERS.items():
        matched = [s for s in normalized if s in cluster_skills_list]
        if matched:
            result[cluster_name] = matched
    return result
