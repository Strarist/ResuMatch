'use client';

import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ds';

interface SkillMatch {
  resume_skill: string;
  job_skill: string;
  score: number;
}

interface SkillMatchGridProps {
  matched: SkillMatch[];
  missing: string[];
  extra: string[];
  matchPercentage: number;
}

export function SkillMatchGrid({ matched, missing, extra, matchPercentage }: SkillMatchGridProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Match percentage header */}
      <div className="flex items-center justify-between">
        <span className="text-small text-text-secondary">Skill Coverage</span>
        <span className={cn(
          'text-h3 font-semibold',
          matchPercentage >= 70 ? 'text-success' : matchPercentage >= 40 ? 'text-warning' : 'text-error'
        )}>
          {matchPercentage.toFixed(0)}%
        </span>
      </div>

      {/* Matched skills */}
      {matched.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Matched</span>
          <div className="grid gap-1.5">
            {matched.map((m) => (
              <div
                key={`${m.resume_skill}-${m.job_skill}`}
                className="flex items-center justify-between rounded-lg border border-success/20 bg-success/5 px-3 py-2"
              >
                <div className="flex items-center gap-2 text-small">
                  <span className="text-text">{m.resume_skill}</span>
                  <span className="text-text-tertiary">→</span>
                  <span className="text-text-secondary">{m.job_skill}</span>
                </div>
                <span className="text-xs font-mono text-success">{(m.score * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {missing.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Missing</span>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((skill) => (
              <StatusBadge key={skill} status="error">{skill}</StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* Extra skills */}
      {extra.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Extra (not required)</span>
          <div className="flex flex-wrap gap-1.5">
            {extra.map((skill) => (
              <StatusBadge key={skill} status="neutral">{skill}</StatusBadge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
