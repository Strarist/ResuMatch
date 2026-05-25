import { z } from 'zod';

export const ApiErrorSchema = z.object({
  detail: z.string(),
});

export const ValidationErrorItemSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

export const ValidationErrorResponseSchema = z.object({
  detail: z.array(ValidationErrorItemSchema),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
