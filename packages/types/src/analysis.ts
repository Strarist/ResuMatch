import { z } from 'zod';

// === Requests ===

export const AnalyzeRequestSchema = z.object({
  resume_id: z.string().uuid(),
  job_description: z.string().min(10),
});

export const BatchAnalyzeRequestSchema = z.object({
  resume_id: z.string().uuid(),
  job_descriptions: z.array(z.string().min(10)).max(10),
});

// === Responses ===

export const DetailedScoresSchema = z.object({
  skills_score: z.number(),
  experience_score: z.number(),
  education_score: z.number(),
});

export const SkillMatchingSchema = z.object({
  skill_matches: z.array(z.unknown()),
  missing_skills: z.array(z.string()),
  extra_skills: z.array(z.string()),
  match_percentage: z.number(),
});

export const RecommendationSchema = z.object({
  type: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

export const AnalysisResponseSchema = z.object({
  resume_id: z.string().uuid(),
  resume_filename: z.string(),
  overall_match_score: z.number(),
  detailed_scores: DetailedScoresSchema,
  resume_analysis: z.object({
    extracted_skills: z.array(z.string()),
    education: z.array(z.unknown()),
    experience: z.array(z.unknown()),
  }),
  job_analysis: z.object({
    required_skills: z.array(z.string()),
    required_education: z.array(z.unknown()),
    required_experience: z.array(z.unknown()),
  }),
  skill_matching: SkillMatchingSchema,
  recommendations: z.array(RecommendationSchema),
});

export const BatchResultItemSchema = z.object({
  job_index: z.number().int(),
  overall_score: z.number().optional(),
  skills_score: z.number().optional(),
  experience_score: z.number().optional(),
  education_score: z.number().optional(),
  required_skills: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export const BatchAnalysisResponseSchema = z.object({
  resume_id: z.string().uuid(),
  total_jobs_analyzed: z.number().int(),
  results: z.array(BatchResultItemSchema),
});

// === Inferred Types ===

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type BatchAnalyzeRequest = z.infer<typeof BatchAnalyzeRequestSchema>;
export type DetailedScores = z.infer<typeof DetailedScoresSchema>;
export type SkillMatching = z.infer<typeof SkillMatchingSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;
export type BatchResultItem = z.infer<typeof BatchResultItemSchema>;
export type BatchAnalysisResponse = z.infer<typeof BatchAnalysisResponseSchema>;
