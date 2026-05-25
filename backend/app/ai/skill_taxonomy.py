"""Skill taxonomy with prerequisite relationships.

Defines a directed graph of skill dependencies.
Used to sequence learning paths and prevent impossible recommendations.
"""

# prerequisite → skill (you need the prerequisite before learning the skill)
PREREQUISITES: dict[str, list[str]] = {
    # Frontend
    "React": ["JavaScript", "HTML", "CSS"],
    "Next.js": ["React", "Node.js"],
    "Vue.js": ["JavaScript", "HTML", "CSS"],
    "Angular": ["TypeScript", "HTML", "CSS"],
    "TypeScript": ["JavaScript"],
    "Tailwind CSS": ["CSS"],
    "Redux": ["React"],
    "GraphQL": ["REST API", "JavaScript"],

    # Backend
    "FastAPI": ["Python"],
    "Django": ["Python"],
    "Flask": ["Python"],
    "Express.js": ["Node.js", "JavaScript"],
    "Spring Boot": ["Java"],
    "Node.js": ["JavaScript"],
    ".NET": ["C#"],
    "REST API": ["HTTP"],

    # Data & ML
    "Machine Learning": ["Python", "Statistics"],
    "Deep Learning": ["Machine Learning", "Linear Algebra"],
    "TensorFlow": ["Python", "Machine Learning"],
    "PyTorch": ["Python", "Machine Learning"],
    "NLP": ["Machine Learning", "Python"],
    "Pandas": ["Python"],
    "NumPy": ["Python"],

    # DevOps & Cloud
    "Kubernetes": ["Docker", "Linux"],
    "Docker": ["Linux"],
    "Terraform": ["Cloud Fundamentals"],
    "CI/CD": ["Git", "Docker"],
    "AWS": ["Cloud Fundamentals"],
    "GCP": ["Cloud Fundamentals"],
    "Azure": ["Cloud Fundamentals"],
    "Helm": ["Kubernetes"],

    # Databases
    "PostgreSQL": ["SQL"],
    "MongoDB": ["NoSQL"],
    "Redis": ["Data Structures"],
    "Elasticsearch": ["NoSQL"],

    # General
    "Microservices": ["REST API", "Docker"],
    "System Design": ["Data Structures", "Networking"],
}

# Estimated learning effort in weeks (for someone with prerequisites met)
EFFORT_WEEKS: dict[str, int] = {
    "HTML": 1, "CSS": 2, "JavaScript": 4, "TypeScript": 2,
    "Python": 4, "Java": 6, "C#": 6, "Go": 4, "Rust": 8,
    "React": 3, "Next.js": 2, "Vue.js": 3, "Angular": 4,
    "Node.js": 2, "Express.js": 1, "FastAPI": 1, "Django": 3,
    "SQL": 2, "PostgreSQL": 2, "MongoDB": 2, "Redis": 1,
    "Docker": 2, "Kubernetes": 4, "Terraform": 3,
    "AWS": 4, "GCP": 4, "Azure": 4,
    "Git": 1, "CI/CD": 2, "Linux": 3,
    "REST API": 1, "GraphQL": 2,
    "Machine Learning": 8, "Deep Learning": 6, "NLP": 4,
    "System Design": 6, "Microservices": 4,
}


def get_prerequisites(skill: str) -> list[str]:
    """Get direct prerequisites for a skill."""
    return PREREQUISITES.get(skill, [])


def get_full_learning_path(skill: str, existing_skills: set[str]) -> list[str]:
    """Get ordered learning path for a skill, excluding already-known skills.

    Returns skills in dependency order (prerequisites first).
    """
    path: list[str] = []
    visited: set[str] = set()

    def _dfs(s: str) -> None:
        if s in visited or s.lower() in {e.lower() for e in existing_skills}:
            return
        visited.add(s)
        for prereq in get_prerequisites(s):
            _dfs(prereq)
        path.append(s)

    _dfs(skill)
    return path


def get_effort_weeks(skill: str) -> int:
    """Estimated weeks to learn a skill (with prerequisites already met)."""
    return EFFORT_WEEKS.get(skill, 3)  # Default 3 weeks for unknown skills
