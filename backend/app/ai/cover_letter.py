"""Cover letter generation service.

Pipeline:
1. Load parsed resume data
2. Extract candidate-job alignment
3. Generate cover letter via streaming AI

Grounding strategy: The prompt includes ONLY facts from the parsed resume.
The AI is instructed to never invent experience, skills, or achievements.
"""

from collections.abc import AsyncGenerator
from enum import Enum
from uuid import UUID

from app.ai import AIMessage, AIStreamChunk
from app.ai.provider_factory import get_ai_provider
from app.ai.resume_parser import ParsedResume


class Tone(str, Enum):
    professional = "professional"
    technical = "technical"
    concise = "concise"
    startup = "startup"
    enterprise = "enterprise"


TONE_INSTRUCTIONS = {
    Tone.professional: "Write in a polished, professional tone suitable for corporate roles.",
    Tone.technical: "Write in a technical tone emphasizing engineering depth and system design thinking.",
    Tone.concise: "Write concisely — under 250 words. Every sentence must add value.",
    Tone.startup: "Write with energy and initiative. Show builder mentality and ownership.",
    Tone.enterprise: "Write formally with emphasis on process, scale, and cross-functional collaboration.",
}

SYSTEM_PROMPT = """You are an expert cover letter writer. Write a compelling, personalized cover letter.

STRICT RULES:
- ONLY reference skills, experience, and education from the RESUME DATA below
- NEVER invent achievements, metrics, or experience not in the resume
- NEVER use generic AI phrases like "I am excited to apply" or "I believe I would be a great fit"
- Use specific details from the resume to demonstrate relevance
- Keep under 400 words unless instructed otherwise
- Use active voice and measurable impact where the resume provides it
- Address specific job requirements with matching resume evidence

{tone_instruction}

RESUME DATA:
Name: {name}
Skills: {skills}
Experience:
{experience}
Education:
{education}

JOB DETAILS:
Title: {job_title}
Company: {company}
Requirements: {job_description}

Write the cover letter now. Do not include any preamble or explanation."""


def _build_prompt(
    parsed: ParsedResume,
    job_description: str,
    job_title: str = "",
    company: str = "",
    tone: Tone = Tone.professional,
) -> list[AIMessage]:
    """Build grounded prompt from parsed resume data."""
    experience_text = "\n".join(
        f"- {e.title} at {e.company} ({e.duration}): {e.description[:200]}"
        for e in parsed.experience[:5]
    ) or "Not specified"

    education_text = "\n".join(
        f"- {e.degree} from {e.institution} ({e.year})"
        for e in parsed.education[:3]
    ) or "Not specified"

    system = SYSTEM_PROMPT.format(
        tone_instruction=TONE_INSTRUCTIONS[tone],
        name=parsed.metadata.name or "Candidate",
        skills=", ".join(parsed.skills[:20]) or "Not specified",
        experience=experience_text,
        education=education_text,
        job_title=job_title or "the role",
        company=company or "the company",
        job_description=job_description[:3000],
    )

    return [AIMessage(role="system", content=system), AIMessage(role="user", content="Write the cover letter.")]


async def generate_cover_letter(
    parsed: ParsedResume,
    job_description: str,
    job_title: str = "",
    company: str = "",
    tone: Tone = Tone.professional,
) -> str:
    """Generate a complete cover letter (non-streaming)."""
    provider = get_ai_provider()
    messages = _build_prompt(parsed, job_description, job_title, company, tone)
    response = await provider.generate(messages, temperature=0.7, max_tokens=1000)
    return response.content


async def stream_cover_letter(
    parsed: ParsedResume,
    job_description: str,
    job_title: str = "",
    company: str = "",
    tone: Tone = Tone.professional,
) -> AsyncGenerator[AIStreamChunk, None]:
    """Stream cover letter generation token by token."""
    provider = get_ai_provider()
    messages = _build_prompt(parsed, job_description, job_title, company, tone)
    async for chunk in provider.generate_stream(messages, temperature=0.7, max_tokens=1000):
        yield chunk
