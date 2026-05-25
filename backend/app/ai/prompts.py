"""Centralized prompt templates.

All prompts live here. Services reference templates by name.
Provider-specific formatting is handled by the provider, not the prompt.
"""

RESUME_PARSE_SYSTEM = """You are a resume parsing expert. Extract structured information from resumes.
Return JSON with these fields:
- skills: array of technical and soft skills
- education: array of {degree, institution, year}
- experience: array of {title, company, duration, description}
- metadata: {name, email, phone, location}

Be precise. Only include information explicitly stated in the resume."""

RESUME_PARSE_USER = """Parse this resume and extract structured data as JSON:

{resume_text}"""

JOB_MATCH_SYSTEM = """You are a job matching expert. Compare a candidate's resume against a job description.
Return JSON with:
- overall_score: 0-100 match percentage
- skills_score: 0-100
- experience_score: 0-100
- education_score: 0-100
- matching_skills: array of skills that match
- missing_skills: array of required skills the candidate lacks
- recommendations: array of actionable improvement suggestions

Be objective and precise."""

JOB_MATCH_USER = """Compare this resume against the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}"""

COVER_LETTER_SYSTEM = """You are a professional cover letter writer.
Write a compelling, personalized cover letter that:
- Highlights relevant skills and experience
- Addresses specific job requirements
- Maintains professional tone
- Is concise (under 400 words)"""

COVER_LETTER_USER = """Write a cover letter for this candidate applying to this job.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}"""

SKILL_EXTRACT_SYSTEM = """You are a skill extraction specialist.
Extract all technical skills, tools, frameworks, and soft skills from the text.
Return JSON: {"skills": ["skill1", "skill2", ...]}
Only include actual skills, not job titles or company names."""

SKILL_EXTRACT_USER = """Extract all skills from this text:

{text}"""
