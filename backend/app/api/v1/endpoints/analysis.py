from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from typing import List, Dict, Optional
from app.api.deps import get_current_user
from app.models.user import User
from app.services.resume_parser import ResumeParser
from app.schemas.resume import ResumeAnalysisResponse
import fitz  # PyMuPDF
import docx
import io
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from fastapi.responses import JSONResponse

router = APIRouter()

nlp = spacy.load("en_core_web_sm")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Helper: extract text from file
async def extract_text_from_file(upload_file: UploadFile) -> str:
    content = await upload_file.read()
    if upload_file.filename.endswith('.pdf'):
        try:
            with fitz.open(stream=content, filetype="pdf") as doc:
                return "\n".join(page.get_text() for page in doc)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parsing error: {e}")
    elif upload_file.filename.endswith('.docx'):
        try:
            doc = docx.Document(io.BytesIO(content))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"DOCX parsing error: {e}")
    else:
        # Assume plain text
        return content.decode(errors="ignore")

# Helper: extract skills/entities from text using spaCy
def extract_skills(text: str) -> List[str]:
    doc = nlp(text)
    # For demo, just use all PROPN and NOUNs as "skills"
    skills = set()
    for ent in doc.ents:
        if ent.label_ in {"ORG", "SKILL", "WORK_OF_ART", "PRODUCT"}:
            skills.add(ent.text.strip())
    for token in doc:
        if token.pos_ in {"PROPN", "NOUN"} and len(token.text) > 2:
            skills.add(token.text.strip())
    return list(skills)

# Helper: main analysis logic
async def analyze_resume_vs_job(resume_file: UploadFile, job_description: str) -> dict:
    resume_text = await extract_text_from_file(resume_file)
    job_text = job_description
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)

    # Embeddings
    resume_emb = embedder.encode([resume_text])[0]
    job_emb = embedder.encode([job_text])[0]
    match_score = float(cosine_similarity([resume_emb], [job_emb])[0][0]) * 100

    # Skill gap analysis (simple)
    missing_skills = [skill for skill in job_skills if skill not in resume_skills]

    # Suggestions (simple heuristics)
    suggestions = []
    if missing_skills:
        suggestions.append(f"Consider adding these skills: {', '.join(missing_skills[:3])}")
    if len(resume_text) < 1000:
        suggestions.append("Add more detail to your resume.")
    suggestions.append("Add more quantifiable achievements.")
    if any(word in job_text.lower() for word in ["docker", "kubernetes"]):
        if not any(word in resume_text.lower() for word in ["docker", "kubernetes"]):
            suggestions.append("Mention familiarity with container orchestration.")

    return {
        "match_score": round(match_score, 1),
        "missing_skills": missing_skills[:5],
        "suggestions": suggestions[:3],
    }

@router.post("/analyze-resume")
async def analyze_resume(
    resume_file: UploadFile = File(...),
    job_description: str = Form(...),
    use_openai: Optional[bool] = Form(False),
):
    try:
        result = await analyze_resume_vs_job(resume_file, job_description)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/ping")
def ping() -> Dict[str, str]:
    return {"message": "analysis endpoint available"} 