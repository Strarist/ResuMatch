'use client';

import { cn } from '@/lib/utils';
import type { AnalysisStage } from '@/lib/useStreamingAnalysis';

const STAGES: { key: AnalysisStage; label: string }[] = [
  { key: 'parsing', label: 'Parsing Resume' },
  { key: 'matching', label: 'Matching Skills' },
  { key: 'scoring', label: 'Computing Scores' },
  { key: 'recommendations', label: 'Generating Insights' },
];

interface AnalysisTimelineProps {
  currentStage: AnalysisStage;
  progress: number;
}

export function AnalysisTimeline({ currentStage, progress }: AnalysisTimelineProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="space-y-2">
      {STAGES.map((stage, i) => {
        const isComplete = i < currentIdx || currentStage === 'complete';
        const isActive = i === currentIdx && currentStage !== 'complete';

        return (
          <div key={stage.key} className="flex items-center gap-3">
            {/* Indicator */}
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                isComplete && 'border-success bg-success/10',
                isActive && 'border-accent bg-accent/10',
                !isComplete && !isActive && 'border-border bg-surface-inset'
              )}
            >
              {isComplete ? (
                <CheckIcon className="h-3 w-3 text-success" />
              ) : isActive ? (
                <div className="h-2 w-2 animate-pulse-subtle rounded-full bg-accent" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-text-tertiary" />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-small transition-colors duration-200',
                isComplete && 'text-text',
                isActive && 'text-accent font-medium',
                !isComplete && !isActive && 'text-text-tertiary'
              )}
            >
              {stage.label}
            </span>

            {/* Progress bar for active stage */}
            {isActive && (
              <div className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-surface-inset">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500 ease-out-expo"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  );
}
