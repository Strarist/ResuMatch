'use client';

import { Panel } from '@/components/ds';
import { Clock } from 'lucide-react';

export interface MilestoneNode {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  effortWeeks: number;
  reason: string;
  strategicRationale?: string;
  status: 'active' | 'completed' | 'deferred';
}

interface RoadmapMilestoneCardProps {
  node: MilestoneNode;
  hasStrategicProfile: boolean;
  onComplete: (skill: string) => void;
  onDefer: (skill: string) => void;
  onUndo: (skill: string) => void;
}

const priorityStyles = {
  high: 'border-error/20 text-error bg-error/5',
  medium: 'border-warning/20 text-warning bg-warning/5',
  low: 'border-info/20 text-info bg-info/5',
} as const;

export function RoadmapMilestoneCard({
  node,
  hasStrategicProfile,
  onComplete,
  onDefer,
  onUndo,
}: RoadmapMilestoneCardProps) {
  const isCompleted = node.status === 'completed';
  const isDeferred = node.status === 'deferred';
  const rationale = node.reason || node.strategicRationale || '';

  return (
    <Panel
      className={`p-4 relative transition-all duration-300 ${
        isCompleted
          ? 'border-success/10 bg-success/[0.02] opacity-70'
          : isDeferred
          ? 'border-warning/10 bg-warning/[0.02] opacity-60'
          : ''
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${
          isCompleted ? 'bg-success' : isDeferred ? 'bg-warning' : 'bg-accent'
        }`}
      />

      <div className="pl-2 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {isCompleted ? (
              <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-success/30">
                <span className="text-xs text-success font-bold">✓</span>
              </div>
            ) : (
              <button
                onClick={() => onComplete(node.skill)}
                disabled={isDeferred || !hasStrategicProfile}
                aria-label={`Mark ${node.skill} as achieved`}
                className="h-5 w-5 rounded-full border border-border hover:border-success flex items-center justify-center flex-shrink-0 mt-0.5 transition-all bg-surface-inset hover:bg-success/10 disabled:opacity-30"
              />
            )}
            <div className="min-w-0 flex-1">
              <span
                className={`text-sm font-semibold text-text block ${
                  isCompleted ? 'line-through text-text-tertiary' : ''
                }`}
              >
                {node.skill}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                <Clock size={12} className="flex-shrink-0" />
                <span>{node.effortWeeks} weeks estimated</span>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
            {isCompleted && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-success/20 text-success bg-success/5 font-semibold uppercase">
                Achieved
              </span>
            )}
            {isDeferred && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-border text-text-tertiary bg-surface-inset font-semibold uppercase">
                Skipped
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full border uppercase font-semibold ${priorityStyles[node.priority]}`}
            >
              {node.priority}
            </span>
          </div>
        </div>

        {rationale && (
          <details className="group">
            <summary className="text-xs text-text-secondary cursor-pointer hover:text-text list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Why it matters
            </summary>
            <p className="text-small text-text-secondary leading-relaxed mt-2 pl-3 border-l border-border-subtle">
              {rationale}
            </p>
          </details>
        )}

        {hasStrategicProfile && (
          <div className="flex gap-2 pt-2 border-t border-border-subtle">
            {!isCompleted && !isDeferred ? (
              <>
                <button
                  onClick={() => onComplete(node.skill)}
                  className="rounded px-3 py-1 text-xs border border-success/20 text-success hover:bg-success/10 transition-all font-semibold"
                >
                  Mark Achieved
                </button>
                <button
                  onClick={() => onDefer(node.skill)}
                  className="rounded px-3 py-1 text-xs border border-border text-text-secondary hover:text-text hover:bg-surface-inset transition-all"
                >
                  Skip Skill
                </button>
              </>
            ) : (
              <button
                onClick={() => onUndo(node.skill)}
                className="rounded px-3 py-1 text-xs border border-border text-text-secondary hover:text-text hover:bg-surface-inset transition-all"
              >
                Undo {isCompleted ? 'Completion' : 'Skip'}
              </button>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
