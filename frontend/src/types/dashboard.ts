// Shared dashboard types
export interface Milestone {
  title?: string;
  skill?: string;
  status?: string;
  progress?: number;
  // Add any additional fields used elsewhere

}

export interface Opportunity {
  title: string;
  company: string;
  alignmentScore: number;
  reasons?: string[];
}
