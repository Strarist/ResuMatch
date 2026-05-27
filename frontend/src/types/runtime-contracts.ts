import { z } from 'zod';

export const DirectivePayloadSchema = z.object({
  directive_type: z.string(),
  priority_level: z.string(),
  description: z.string(),
  rationale: z.string(),
}).partial();

export const AgentUpdatePayloadSchema = z.object({
  agent_id: z.string(),
  confidence: z.number(),
  payload: z.object({
    signal: z.string(),
    details: z.string()
  }).partial(),
}).partial();

export const TopologyDeltaPayloadSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  type: z.string().optional(),
}).partial();

export const TopologyEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string(),
}).partial();

export const PropagationPayloadSchema = z.object({
  source: z.string(),
  target: z.string(),
  impact: z.string(),
}).partial();

export const StrategicMemorySchema = z.object({
  title: z.string(),
  description: z.string(),
  time: z.string(),
  confidence: z.number().or(z.string()),
}).partial();

export const MutationFeedSchema = z.object({
  signal: z.string(),
  delta: z.string(),
  reason: z.string(),
}).partial();

export const RuntimeDeltaPayloadSchema = z.object({
  directive: DirectivePayloadSchema.optional(),
  agents: z.array(AgentUpdatePayloadSchema).optional(),
  nodes: z.array(TopologyDeltaPayloadSchema).optional(),
  edges: z.array(TopologyEdgeSchema).optional(),
  propagationFeed: z.array(PropagationPayloadSchema).optional(),
  timeline: z.array(StrategicMemorySchema).optional(),
  feed: z.array(MutationFeedSchema).optional(),
}).partial();

export type RuntimeDeltaPayload = z.infer<typeof RuntimeDeltaPayloadSchema>;
export type DirectivePayload = z.infer<typeof DirectivePayloadSchema>;
export type AgentUpdatePayload = z.infer<typeof AgentUpdatePayloadSchema>;
export type TopologyDeltaPayload = z.infer<typeof TopologyDeltaPayloadSchema>;
export type PropagationPayload = z.infer<typeof PropagationPayloadSchema>;
export type StrategicMemory = z.infer<typeof StrategicMemorySchema>;
export type MutationFeed = z.infer<typeof MutationFeedSchema>;
