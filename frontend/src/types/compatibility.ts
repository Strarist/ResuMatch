// Shared compatibility types for frontend and backend
// Converted from backend/app/schemas/compatibility.py

export enum MatchCategory {
  EXCELLENT = "excellent",  // > 80%
  GOOD = "good",           // 60-80%
  FAIR = "fair",           // 40-60%
  POOR = "poor"            // < 40%
}

export interface SkillMatch {
  name: string;
  score: number; // 0-1
  category: string;
  semantic_score?: number;
  keyword_score?: number;
  is_matched: boolean;
  suggestions?: string[];
}

export interface RoleMatch {
  title_similarity: number; // 0-1
  category_match: number; // 0-1
  required_level?: string;
  current_level?: string;
  overall_score: number; // 0-1
  category: MatchCategory;
}

export interface ExperienceMatch {
  years_match: number; // 0-1
  role_relevance: number; // 0-1
  required_years: number;
  actual_years: number;
  overall_score: number; // 0-1
  category: MatchCategory;
  gaps?: string[];
}

export interface CompatibilityReport {
  resume_id: string; // UUID as string
  job_id: string; // UUID as string
  overall_score: number; // 0-1
  category: MatchCategory;
  
  // Detailed matches
  skill_matches: SkillMatch[];
  role_match: RoleMatch;
  experience_match: ExperienceMatch;
  
  // Summary statistics
  matched_skills_count: number;
  missing_skills_count: number;
  average_skill_score: number;
  
  // Improvement suggestions
  suggestions: string[];
  
  // Additional metadata
  analysis_timestamp: string;
  match_strategy: string; // "hybrid", "semantic", or "keyword"
}

export interface CompatibilityRequest {
  resume_id: string; // UUID as string
  job_id: string; // UUID as string
  strategy: string; // "hybrid", "semantic", or "keyword"
}

export interface CompatibilityResponse {
  report: CompatibilityReport;
  processing_time: number; // in seconds
  cached: boolean;
} 