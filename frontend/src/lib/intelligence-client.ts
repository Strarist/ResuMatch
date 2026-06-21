/**
 * Centralized Intelligence Client — single data access layer for all API calls.
 *
 * Provides: auth headers, typed responses, error normalization, request deduplication.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Request deduplication cache
const inflight = new Map<string, Promise<unknown>>();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const key = `${options.method || 'GET'}:${url}:${options.body || ''}`;

  if (!options.method || options.method === 'GET') {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;
  }

  const promise = (async () => {
    const res = await fetch(url, {
      headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string> | undefined) },
      credentials: 'include',
      ...options,
    });
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

export const strategic = {
  getFocus: () => request<StrategicFocusResponse>('/v1/strategic/focus'),
  getProfile: () => request<StrategicProfileResponse>('/v1/strategic/profile'),
  getLifecycle: () => request<LifecycleResponse>('/v1/strategic/lifecycle'),
  updateProfile: (body: StrategicProfileUpdate) =>
    request<{ message: string; target_role: string }>('/v1/strategic/profile/update', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const portfolio = {
  listProjects: () =>
    request<{ projects: PortfolioProject[] }>('/v1/portfolio/projects'),
  getRecruiterProfile: () => request<RecruiterProfileResponse>('/v1/portfolio/recruiter-profile'),
};

export const progress = {
  getSnapshot: () => request<ProgressSnapshot>('/v1/progress/snapshot'),
};

export const onboarding = {
  getState: () => request<OnboardingState>('/v1/onboarding/state'),
  saveState: (body: Partial<OnboardingState>) =>
    request<{ status: string; step: string; is_complete: string }>('/v1/onboarding/state', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export const opportunities = {
  getMatches: () => request<OpportunityMatchesResponse>('/v1/opportunities/matches'),
  getGaps: () => request<{ gaps: OpportunityGap[] }>('/v1/opportunities/gaps'),
  getRadar: () => request<MarketRadar>('/v1/opportunities/radar'),
  getAll: () =>
    Promise.allSettled([
      opportunities.getMatches(),
      opportunities.getGaps(),
      opportunities.getRadar(),
    ]).then(([matches, gaps, radar]) => ({
      matches: matches.status === 'fulfilled' ? matches.value.matches : [],
      matchStatus: matches.status === 'fulfilled' ? matches.value.status : undefined,
      matchMessage: matches.status === 'fulfilled' ? matches.value.message : undefined,
      gaps: gaps.status === 'fulfilled' ? gaps.value.gaps : [],
      radar: radar.status === 'fulfilled' ? radar.value : null,
    })),
};

export const trajectory = {
  getSnapshot: () => request<TrajectorySnapshot>('/v1/trajectory/snapshot'),
};

export const market = {
  getSnapshot: () => request<MarketSnapshot>('/v1/market-intelligence/snapshot'),
};

export const roadmap = {
  getState: () => request<{ state: RoadmapState | null }>('/v1/roadmap-intel/state'),
  recalibrate: () => request<{ message?: string }>('/v1/roadmap-intel/recalibrate', { method: 'POST' }),
  mutate: (target_skills: string[]) => request<MutationResult>('/v1/roadmap-intel/mutate', { method: 'POST', body: JSON.stringify({ target_skills }) }),
  completeNode: (skill: string) => request('/v1/roadmap-intel/node/complete', { method: 'POST', body: JSON.stringify({ skill }) }),
  deferNode: (skill: string) => request('/v1/roadmap-intel/node/defer', { method: 'POST', body: JSON.stringify({ skill }) }),
  undoNode: (skill: string) => request('/v1/roadmap-intel/node/undo', { method: 'POST', body: JSON.stringify({ skill }) }),
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
  upload: (file: File) => uploadFormData('/v1/resumes', file),
  preview: (file: File) => uploadFormData<ResumePreviewResponse>('/v1/resumes/preview', file),
  delete: (resumeId: string) =>
    request<{ message: string }>(`/v1/resumes/${resumeId}`, { method: 'DELETE' }),
  replace: (resumeId: string, file: File) => uploadFormData(`/v1/resumes/${resumeId}`, file, 'PUT'),
};

async function uploadFormData<T = unknown>(endpoint: string, file: File, method = 'POST'): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || 'Upload failed');
  }
  return res.json() as Promise<T>;
}

/** Fetch all dashboard data in parallel with deduplicated GET requests. */
export async function fetchDashboardData() {
  const [focus, matches, roadmapState, gaps, recommendations, radar, marketSnapshot] = await Promise.allSettled([
    strategic.getFocus(),
    opportunities.getMatches(),
    roadmap.getState(),
    opportunities.getGaps(),
    intelligence.getRecommendations(),
    opportunities.getRadar(),
    market.getSnapshot(),
  ]);
  return { focus, matches, roadmapState, gaps, recommendations, radar, marketSnapshot };
}

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

export interface StrategicFocusResponse {
  focus: Record<string, unknown>;
  plan: Record<string, unknown>;
  execution: Record<string, unknown>;
  risks: { risk_score: number; count: number };
  personalization: Record<string, unknown>;
}

export interface StrategicProfileResponse {
  skills: { name: string; origin: string }[] | string[];
  target_role: string;
  specialization: string;
  years_of_experience: number;
  completeness_score: number;
}

export interface LifecycleResponse {
  has_strategic_profile: boolean;
  resume_parse_status: string;
  lifecycle_stage: number;
}

export interface OpportunityMatchesResponse {
  matches: OpportunityMatch[];
  status?: 'ready' | 'pending';
  message?: string;
}

export interface StrategicProfileUpdate {
  skills: string[];
  target_role: string;
  specialization: string;
  years_of_experience?: number;
}

export interface PortfolioProject {
  id: string;
  name: string;
  stack: string[];
  live_url: string | null;
  production_readiness: number;
  signal_strength: number;
  complexity: string;
}

export interface OpportunityMatch {
  title: string;
  company: string;
  alignment_score: number;
  match_score?: number;
  confidence: number;
  match_reason?: string[];
  source?: string;
  posted_at?: string;
  published_at?: string;
  status?: string;
  url?: string;
  compensation?: string;
  missing_requirements?: string[];
}

export interface OpportunityGap {
  target_role: string;
  readiness_percentage: number;
  missing_skills: string[];
  missing_proof: string[];
  estimated_completion_time: string;
}

export interface MarketRadar {
  emerging_domains: string[];
  high_roi_skills: { skill: string; roi: number; trend: string }[];
  salary_growth_paths: string[];
  underutilized_strengths: string[];
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
  status?: 'ready' | 'pending';
  message?: string;
  skill_demand: { skill: string; demand: number; trend: string; saturation: string; confidence?: string; source?: string }[];
  roi_skills: { skill: string; roi_score: number; demand: number; trend: string; salary_premium: number }[];
  recruiter_attractiveness: { overall_score: number; portfolio_strength: number; stack_coherence: number };
  salary_trajectory: { seniority: string; estimated_range: { low: number; high: number }; growth_potential: string };
  high_value_missing: { skill: string; roi_score: number; salary_premium: number }[];
}

export interface RoadmapState {
  id: string;
  target_role: string;
  version: number;
  snapshot: { milestones: { skill: string; priority: string; effort_weeks: number; impact_estimate?: number; reason: string; status?: string; progress?: number; dependency?: string; recommended_sprint?: string }[] };
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
  parse_status?: string | null;
  file_size_bytes?: number;
  parsed_data?: Record<string, unknown> | null;
}

export interface ResumePreviewResponse {
  skills: string[];
  target_role: string;
  specialization: string;
  years_of_experience: number;
  experience?: unknown[];
  projects?: unknown[];
  education?: unknown[];
  certifications?: unknown[];
  confidence_score?: number;
}

export interface OnboardingState {
  current_step: string;
  is_complete: string;
  target_role: string | null;
  specialization: string | null;
  experience_level: string | null;
  github_connected: string | null;
  linkedin_connected: string | null;
  growth_priority: string | null;
  execution_intensity: string | null;
}

export interface RecruiterProfileResponse {
  hiring_confidence: number;
  production_readiness: number;
  technical_depth: number;
  specialization_strength: number;
  differentiation_score: number;
  portfolio_maturity: string;
  strongest_signals: string[];
  hiring_risks: string[];
  role_fit: { role: string; skill_readiness: number; proof_adjusted: number; missing: string[] }[];
  project_count: number;
  deployed_count: number;
}

export interface ProgressSnapshot {
  execution: {
    momentum_score: number;
    execution_consistency: number;
    completion_velocity: number;
    acceptance_rate: number;
    stagnation_risk: string;
    stagnation_signals: { cause: string; detail: string }[];
    burnout_risk: string;
    growth_acceleration: number;
    execution_style: string;
    days_since_activity: number;
    completed_count: number;
    deferred_count: number;
  };
  risks: { risk_score: number; primary_risks: { type: string; severity: string; detail: string; mitigation: string }[] };
  interventions: { type: string; title: string; explanation: string; priority: string; estimated_impact: string }[];
  summary: { dominant_path: string; competitiveness: number; focus_areas: string[] };
}
