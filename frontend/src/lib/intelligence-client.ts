/**
 * Centralized Intelligence Client — single data access layer for all API calls.
 *
 * Provides: auth headers, typed responses, error normalization, request deduplication.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

// Request deduplication cache
const inflight = new Map<string, Promise<unknown>>();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const key = `${options.method || 'GET'}:${url}:${options.body || ''}`;

  // Deduplicate GET requests
  if (!options.method || options.method === 'GET') {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;
  }

  const promise = (async () => {
    const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include', ...options });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, body.detail || body.error || 'Request failed');
    }
    return res.json() as Promise<T>;
  })();

  if (!options.method || options.method === 'GET') {
    inflight.set(key, promise);
    promise.finally(() => setTimeout(() => inflight.delete(key), 100));
  }

  return promise;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// === Intelligence APIs ===

export const intelligence = {
  getSummary: () => request<IntelligenceSummary>('/v1/intelligence/summary'),
  getRecommendations: () => request<{ recommendations: Recommendation[] }>('/v1/intelligence/recommendations'),
  getFeed: () => request<{ feed: FeedItem[] }>('/v1/intelligence/feed'),
  recompute: () => request<{ summary: IntelligenceSummary }>('/v1/intelligence/recompute', { method: 'POST' }),
};

export const trajectory = {
  getSnapshot: () => request<TrajectorySnapshot>('/v1/trajectory/snapshot'),
};

export const market = {
  getSnapshot: () => request<MarketSnapshot>('/v1/market-intelligence/snapshot'),
};

export const roadmap = {
  getState: () => request<{ state: RoadmapState | null }>('/v1/roadmap-intel/state'),
  mutate: (target_skills: string[]) => request<MutationResult>('/v1/roadmap-intel/mutate', { method: 'POST', body: JSON.stringify({ target_skills }) }),
  completeNode: (skill: string) => request('/v1/roadmap-intel/node/complete', { method: 'POST', body: JSON.stringify({ skill }) }),
  deferNode: (skill: string) => request('/v1/roadmap-intel/node/defer', { method: 'POST', body: JSON.stringify({ skill }) }),
};

export const workspace = {
  getSessions: () => request<{ sessions: WorkspaceSession[] }>('/v1/workspace/sessions'),
  createSession: (title = 'New Session') => request<WorkspaceSession>('/v1/workspace/session', { method: 'POST', body: JSON.stringify({ title }) }),
  getSession: (id: string) => request<{ session: WorkspaceSession; messages: WorkspaceMessage[] }>(`/v1/workspace/session/${id}`),
  sendMessage: (sessionId: string, content: string) => request<{ message: WorkspaceMessage }>(`/v1/workspace/session/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ content }) }),
  recordAction: (rec_type: string, rec_title: string, action: string) => request('/v1/workspace/recommendations/action', { method: 'POST', body: JSON.stringify({ recommendation_type: rec_type, recommendation_title: rec_title, action }) }),
};

export const resumes = {
  list: () => request<{ resumes: ResumeItem[] }>('/v1/resumes'),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_URL}/v1/resumes`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => { if (!r.ok) throw new ApiError(r.status, 'Upload failed'); return r.json(); });
  },
};

// === Types ===

export interface IntelligenceSummary {
  dominant_path: string;
  secondary_paths: string[];
  competitiveness: number;
  confidence: number;
  market_alignment: number;
  salary_range: { low: number; high: number };
  growth_potential: string;
  roadmap_momentum: number;
  focus_areas: string[];
  adjacent_roles: { role: string; readiness: number; gap_skills: string[] }[];
  drift_detected: boolean;
  drift_details: string | null;
}

export interface Recommendation {
  type: string;
  title: string;
  explanation: string;
  priority: string;
  confidence: number;
  estimated_impact: string;
  related_domains: string[];
}

export interface FeedItem {
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TrajectorySnapshot {
  dominant_path: string;
  readiness_scores: Record<string, { score: number; matched_core: string[]; missing_core: string[] }>;
  specializations: Record<string, { strength: number; skills: string[]; momentum: number; emerging: boolean; dominant: boolean }>;
  adjacent_roles: { role: string; readiness: number; gap_skills: string[] }[];
  competitiveness_score: number;
  confidence: number;
}

export interface MarketSnapshot {
  skill_demand: { skill: string; demand: number; trend: string; saturation: string }[];
  roi_skills: { skill: string; roi_score: number; demand: number; trend: string; salary_premium: number }[];
  recruiter_attractiveness: { overall_score: number; portfolio_strength: number; stack_coherence: number };
  salary_trajectory: { seniority: string; estimated_range: { low: number; high: number }; growth_potential: string };
  high_value_missing: { skill: string; roi_score: number; salary_premium: number }[];
}

export interface RoadmapState {
  id: string;
  target_role: string;
  version: number;
  snapshot: { milestones: { skill: string; priority: string; effort_weeks: number; reason: string }[] };
  completed_nodes: string[];
  deferred_nodes: string[];
  active_focus_areas: string[];
}

export interface MutationResult {
  mutations: { type: string; skill?: string }[];
  new_focus_areas: string[];
  snapshot: { milestones: unknown[] };
}

export interface WorkspaceSession {
  id: string;
  title: string;
  type: string;
  updated_at?: string;
}

export interface WorkspaceMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ResumeItem {
  id: string;
  filename: string;
  skills: string[] | null;
  uploaded_at: string | null;
}
