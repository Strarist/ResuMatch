export interface MatchResult {
  id: string;
  resume_id: string;
  job_id: string;
  overall_score: number;
  category: 'excellent' | 'good' | 'fair' | 'poor';
  skill_match: {
    matched_skills: string[];
    missing_skills: string[];
    score: number;
  };
  experience_match: {
    actual_years: number;
    required_years: number;
    score: number;
    gaps?: string[];
  };
  role_match: {
    title_similarity: number;
    category_match: number;
    overall_score: number;
  };
  education_match?: {
    degree_match: boolean;
    field_match: boolean;
    score: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MatchSummary {
  total_matches: number;
  excellent_matches: number;
  good_matches: number;
  fair_matches: number;
  poor_matches: number;
  average_score: number;
}

export interface MatchFilters {
  min_score?: number;
  categories?: string[];
  skills?: string[];
  experience_years?: number;
  education_level?: string;
} 