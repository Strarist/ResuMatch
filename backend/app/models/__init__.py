# Import all models here so SQLAlchemy can discover them
from .user import User
from .resume import Resume
from .job import Job
from .job_match import JobMatch
from .analysis import ResumeAnalysis
# Add other models here as needed

__all__ = ["User", "Resume", "Job", "JobMatch", "ResumeAnalysis"] 