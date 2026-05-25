"""Semantic similarity computation for skill matching.

Uses local embeddings (all-MiniLM-L6-v2) to compute cosine similarity
between resume skills and job requirements.

Since embeddings are L2-normalized, cosine similarity = dot product.
This makes similarity computation a single matrix multiplication.
"""

import numpy as np

from app.ai.embeddings import embed_texts

MATCH_THRESHOLD = 0.6  # Skills with similarity >= 0.6 are considered matches


def compute_skill_similarity(resume_skills: list[str], job_skills: list[str]) -> dict:
    """Compute semantic similarity between two skill sets.

    Returns:
        {
            "matched_skills": [{"resume_skill": str, "job_skill": str, "score": float}],
            "missing_skills": [str],  # job skills with no resume match
            "extra_skills": [str],    # resume skills with no job match
            "match_percentage": float  # 0-100
        }
    """
    if not resume_skills or not job_skills:
        return {
            "matched_skills": [],
            "missing_skills": job_skills or [],
            "extra_skills": resume_skills or [],
            "match_percentage": 0.0,
        }

    resume_embeddings = embed_texts(resume_skills)
    job_embeddings = embed_texts(job_skills)

    # Cosine similarity matrix: (num_job_skills, num_resume_skills)
    # Since vectors are normalized, dot product = cosine similarity
    similarity_matrix = job_embeddings @ resume_embeddings.T

    matched_skills = []
    matched_job_indices: set[int] = set()
    matched_resume_indices: set[int] = set()

    # For each job skill, find the best matching resume skill
    for j_idx in range(len(job_skills)):
        best_r_idx = int(np.argmax(similarity_matrix[j_idx]))
        score = float(similarity_matrix[j_idx, best_r_idx])

        if score >= MATCH_THRESHOLD:
            matched_skills.append({
                "resume_skill": resume_skills[best_r_idx],
                "job_skill": job_skills[j_idx],
                "score": round(score, 3),
            })
            matched_job_indices.add(j_idx)
            matched_resume_indices.add(best_r_idx)

    missing_skills = [job_skills[i] for i in range(len(job_skills)) if i not in matched_job_indices]
    extra_skills = [resume_skills[i] for i in range(len(resume_skills)) if i not in matched_resume_indices]
    match_percentage = (len(matched_skills) / len(job_skills)) * 100 if job_skills else 0.0

    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "extra_skills": extra_skills,
        "match_percentage": round(match_percentage, 1),
    }
