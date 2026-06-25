const SPECIALIZATION_OPTIONS = [
  'Full Stack',
  'Backend',
  'Cloud',
  'AI',
  'DevOps',
  'Frontend',
  'General',
] as const;

export type SpecializationOption = (typeof SPECIALIZATION_OPTIONS)[number];

/** Map backend/inferred specialization strings to profile Select options. */
export function normalizeSpecialization(value: string | null | undefined): SpecializationOption {
  if (!value) return 'Full Stack';
  const trimmed = value.trim();
  if ((SPECIALIZATION_OPTIONS as readonly string[]).includes(trimmed)) {
    return trimmed as SpecializationOption;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('full stack') || lower.includes('fullstack')) return 'Full Stack';
  if (lower.includes('backend') || lower.includes('back-end')) return 'Backend';
  if (lower.includes('frontend') || lower.includes('front-end')) return 'Frontend';
  if (lower.includes('devops') || lower.includes('sre') || lower.includes('reliability')) return 'DevOps';
  if (lower.includes('cloud') || lower.includes('infrastructure')) return 'Cloud';
  if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learning')) return 'AI';
  return 'General';
}

export function resolveProfileField<T>(
  value: T | null | undefined,
  fallback: T
): T {
  return value === null || value === undefined ? fallback : value;
}
