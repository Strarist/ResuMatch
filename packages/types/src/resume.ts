import { z } from 'zod';

export const ResumeSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  skills: z.array(z.string()).nullable(),
  uploaded_at: z.string().datetime().nullable(),
  matches_count: z.number().int().optional(),
});

export const ResumeListResponseSchema = z.object({
  resumes: z.array(ResumeSchema),
});

export const ResumeDetailResponseSchema = z.object({
  resume: ResumeSchema,
});

export const ResumeUploadResponseSchema = z.object({
  message: z.string(),
  resume_id: z.string().uuid(),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type ResumeListResponse = z.infer<typeof ResumeListResponseSchema>;
export type ResumeDetailResponse = z.infer<typeof ResumeDetailResponseSchema>;
export type ResumeUploadResponse = z.infer<typeof ResumeUploadResponseSchema>;
