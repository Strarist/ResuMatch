import { z } from 'zod';

/**
 * SSE Event Contracts for real-time analysis streaming.
 *
 * Each event has a discriminated `type` field that the frontend
 * uses to route to the correct handler. This prevents desynchronization
 * where the frontend expects one shape but receives another.
 */

// === Base Event ===

const BaseEventSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
});

// === Event Types ===

export const AnalysisProgressEventSchema = BaseEventSchema.extend({
  type: z.literal('analysis.progress'),
  data: z.object({
    resume_id: z.string().uuid(),
    stage: z.enum(['parsing', 'matching', 'scoring', 'recommendations']),
    progress: z.number().min(0).max(100),
    message: z.string(),
  }),
});

export const AnalysisCompleteEventSchema = BaseEventSchema.extend({
  type: z.literal('analysis.complete'),
  data: z.object({
    resume_id: z.string().uuid(),
    overall_score: z.number(),
    skills_score: z.number(),
    experience_score: z.number(),
    education_score: z.number(),
  }),
});

export const AnalysisErrorEventSchema = BaseEventSchema.extend({
  type: z.literal('analysis.error'),
  data: z.object({
    resume_id: z.string().uuid(),
    error: z.string(),
    retryable: z.boolean(),
  }),
});

export const StreamTokenEventSchema = BaseEventSchema.extend({
  type: z.literal('stream.token'),
  data: z.object({
    content: z.string(),
    done: z.boolean(),
  }),
});

export const HeartbeatEventSchema = BaseEventSchema.extend({
  type: z.literal('heartbeat'),
  data: z.object({}),
});

// === Discriminated Union ===

export const SSEEventSchema = z.discriminatedUnion('type', [
  AnalysisProgressEventSchema,
  AnalysisCompleteEventSchema,
  AnalysisErrorEventSchema,
  StreamTokenEventSchema,
  HeartbeatEventSchema,
]);

// === Inferred Types ===

export type AnalysisProgressEvent = z.infer<typeof AnalysisProgressEventSchema>;
export type AnalysisCompleteEvent = z.infer<typeof AnalysisCompleteEventSchema>;
export type AnalysisErrorEvent = z.infer<typeof AnalysisErrorEventSchema>;
export type StreamTokenEvent = z.infer<typeof StreamTokenEventSchema>;
export type HeartbeatEvent = z.infer<typeof HeartbeatEventSchema>;
export type SSEEvent = z.infer<typeof SSEEventSchema>;

// === Event type guard for frontend consumers ===

export type SSEEventType = SSEEvent['type'];
