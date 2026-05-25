'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ds';
import type { RoadmapMilestone } from '@/lib/useStreamingRoadmap';

// === MilestoneCard: Expandable card for a single learning milestone ===

interface MilestoneCardProps {
  milestone: RoadmapMilestone;
  index: number;
  isLast: boolean;
}

export function MilestoneCard({ milestone, index, isLast }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
            milestone.priority === 'high' && 'border-accent bg-accent/10 text-accent',
            milestone.priority === 'medium' && 'border-warning bg-warning/10 text-warning',
            milestone.priority === 'low' && 'border-text-tertiary bg-surface-inset text-text-tertiary',
          )}
        >
          {index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>

      {/* Card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'mb-4 flex-1 rounded-xl border border-border bg-surface-raised p-4 text-left transition-all duration-200',
          'hover:border-border hover:bg-surface-overlay',
          expanded && 'border-accent/30 bg-surface-overlay'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-body font-medium text-text">{milestone.skill}</span>
            <StatusBadge status={milestone.priority === 'high' ? 'error' : milestone.priority === 'medium' ? 'warning' : 'info'}>
              {milestone.priority}
            </StatusBadge>
          </div>
          <span className="text-xs font-mono text-text-tertiary">{milestone.effort_weeks}w</span>
        </div>

        {/* Reason */}
        <p className="mt-1 text-small text-text-secondary">{milestone.reason}</p>

        {/* Impact bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-inset">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-out-expo"
              style={{ width: `${Math.min(milestone.impact_estimate / 15 * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-text-tertiary">+{milestone.impact_estimate.toFixed(0)}%</span>
        </div>

        {/* Expanded: prerequisites */}
        {expanded && milestone.prerequisites.length > 0 && (
          <div className="mt-3 animate-fade-in border-t border-border-subtle pt-3">
            <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Prerequisites</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {milestone.prerequisites.map((p) => (
                <span key={p} className="rounded-md bg-surface-inset px-2 py-0.5 text-xs text-text-secondary">{p}</span>
              ))}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

// === RoadmapTimeline: Full milestone progression ===

interface RoadmapTimelineProps {
  milestones: RoadmapMilestone[];
  totalWeeks: number;
  scoreImprovement: number;
}

export function RoadmapTimeline({ milestones, totalWeeks, scoreImprovement }: RoadmapTimelineProps) {
  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-inset px-4 py-3">
        <div className="flex-1">
          <span className="text-xs text-text-tertiary">Estimated Effort</span>
          <p className="text-h3 font-semibold text-text">{totalWeeks} weeks</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1">
          <span className="text-xs text-text-tertiary">Score Improvement</span>
          <p className="text-h3 font-semibold text-success">+{scoreImprovement.toFixed(0)}%</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex-1">
          <span className="text-xs text-text-tertiary">Milestones</span>
          <p className="text-h3 font-semibold text-text">{milestones.length}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="pl-1">
        {milestones.map((m, i) => (
          <MilestoneCard key={m.skill} milestone={m} index={i} isLast={i === milestones.length - 1} />
        ))}
      </div>
    </div>
  );
}
