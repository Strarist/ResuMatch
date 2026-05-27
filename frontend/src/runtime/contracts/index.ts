import { z } from 'zod';

export const DirectivePayloadSchema = z.object({
  directive_type: z.string(),
  priority_level: z.string(),
  description: z.string(),
  rationale: z.string(),
}).partial();

export const AgentTelemetryPayloadSchema = z.object({
  agent_id: z.string(),
  confidence: z.number(),
  payload: z.object({
    signal: z.string(),
    details: z.string()
  }).partial(),
}).partial();

export const TopologyPayloadSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string().optional(),
    domain: z.string().optional(),
    type: z.string().optional()
  }).partial()).optional(),
  edges: z.array(z.object({
    source: z.string(),
    target: z.string(),
    type: z.string(),
    weight: z.number().optional()
  }).partial()).optional()
}).partial();

export const PropagationPayloadSchema = z.object({
  source: z.string(),
  target: z.string(),
  impact: z.string(),
}).partial();

export const ReplayPayloadSchema = z.object({
  title: z.string(),
  description: z.string(),
  time: z.string(),
  confidence: z.number().or(z.string()),
}).partial();

export const MutationFeedSchema = z.object({
  signal: z.string(),
  delta: z.string(),
  reason: z.string(),
  confidence: z.string().optional(),
  time: z.string().optional()
}).partial();

export const OrchestrationSchema = z.object({
  directive: DirectivePayloadSchema.optional().nullable(),
  agent_activity: z.array(AgentTelemetryPayloadSchema).optional().nullable(),
  topology: z.array(z.any()).optional().nullable(),
  telemetry: z.array(z.any()).optional().nullable(),
  constraints: z.array(z.string()).optional().nullable()
}).partial().optional().nullable();

export const RuntimeDeltaPayloadSchema = z.object({
  runtime_version: z.string().refine((v) => v.startsWith("10.3"), {
    message: "Incompatible runtime version: Must be 10.3.x"
  }).optional().nullable(),
  type: z.string().optional(),
  data: z.any().optional(),
  metrics: z.any().optional(),
  mutation: MutationFeedSchema.optional(),
  graph: TopologyPayloadSchema.optional(),
  propagation: z.array(PropagationPayloadSchema).optional(),
  leverage: z.any().optional(),
  orchestration: OrchestrationSchema
}).partial();

export type RuntimeDeltaPayload = z.infer<typeof RuntimeDeltaPayloadSchema>;
export type DirectivePayload = z.infer<typeof DirectivePayloadSchema>;
export type AgentTelemetryPayload = z.infer<typeof AgentTelemetryPayloadSchema>;
export type TopologyPayload = z.infer<typeof TopologyPayloadSchema>;
export type PropagationPayload = z.infer<typeof PropagationPayloadSchema>;
export type ReplayPayload = z.infer<typeof ReplayPayloadSchema>;
export type MutationFeed = z.infer<typeof MutationFeedSchema>;
