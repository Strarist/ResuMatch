'use client';

import { cn } from '@/lib/utils';

// === MatchScoreDial: Large hero score with animated arc ===

interface MatchScoreDialProps {
  score: number; // 0-100
  confidence: number; // 0-1
  className?: string;
}

export function MatchScoreDial({ score, confidence, className }: MatchScoreDialProps) {
  const size = 160;
  const stroke = 8;
  const radius = (size - stroke * 2) / 2;
  const circumference = Math.PI * radius; // half-circle
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Partial Match' : 'Weak Match';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${stroke} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke} ${size / 2}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${stroke} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke} ${size / 2}`}
          fill="none" stroke={`hsl(${color})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out-expo"
        />
      </svg>
      <div className="relative -mt-12 text-center">
        <span className="text-display text-text">{Math.round(score)}</span>
        <span className="text-h3 text-text-tertiary">/100</span>
      </div>
      <span className="mt-1 text-small font-medium" style={{ color: `hsl(${color})` }}>{label}</span>
      <span className="text-xs text-text-tertiary">Confidence: {Math.round(confidence * 100)}%</span>
    </div>
  );
}

// === ConfidenceMeter: Horizontal bar showing data completeness ===

interface ConfidenceMeterProps {
  value: number; // 0-1
  label?: string;
}

export function ConfidenceMeter({ value, label = 'Analysis Confidence' }: ConfidenceMeterProps) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">{label}</span>
        <span className="text-xs font-mono text-text-secondary">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-inset">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700 ease-out-expo"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// === GapMap: Visual representation of skill gaps with severity ===

interface GapItem {
  skill: string;
  impact: number; // 0-15 estimated score improvement
  effort_weeks: number;
  priority: 'high' | 'medium' | 'low';
}

interface GapMapProps {
  gaps: GapItem[];
}

export function GapMap({ gaps }: GapMapProps) {
  if (gaps.length === 0) return null;

  const maxImpact = Math.max(...gaps.map((g) => g.impact), 1);

  return (
    <div className="space-y-2">
      {gaps.map((gap) => {
        const width = (gap.impact / maxImpact) * 100;
        return (
          <div key={gap.skill} className="group flex items-center gap-3">
            {/* Skill name */}
            <span className="w-28 shrink-0 truncate text-small text-text-secondary">{gap.skill}</span>

            {/* Impact bar */}
            <div className="flex-1">
              <div className="h-5 w-full overflow-hidden rounded bg-surface-inset">
                <div
                  className={cn(
                    'h-full rounded transition-all duration-500 ease-out-expo',
                    gap.priority === 'high' && 'bg-error/60',
                    gap.priority === 'medium' && 'bg-warning/60',
                    gap.priority === 'low' && 'bg-info/40',
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>

            {/* Effort */}
            <span className="w-14 shrink-0 text-right text-xs text-text-tertiary">
              {gap.effort_weeks}w
            </span>
          </div>
        );
      })}
    </div>
  );
}

// === SignalBreakdown: Multi-signal score explanation ===

interface Signal {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  explanation: string;
}

interface SignalBreakdownProps {
  signals: Signal[];
}

export function SignalBreakdown({ signals }: SignalBreakdownProps) {
  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <div key={signal.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-small text-text capitalize">{signal.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">{Math.round(signal.weight * 100)}% weight</span>
              <span className={cn(
                'text-small font-mono font-medium',
                signal.score >= 70 ? 'text-success' : signal.score >= 40 ? 'text-warning' : 'text-error'
              )}>
                {Math.round(signal.score)}
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-inset">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out-expo',
                signal.score >= 70 ? 'bg-success' : signal.score >= 40 ? 'bg-warning' : 'bg-error'
              )}
              style={{ width: `${signal.score}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary">{signal.explanation}</p>
        </div>
      ))}
    </div>
  );
}
