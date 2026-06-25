'use client';

import { Panel } from '@/components/ds';
import { ArrowUpRight } from 'lucide-react';

interface RoadmapSummaryProps {
  completionPercent: number;
  targetRole: string;
  activeSpecialization: string;
  marketAlignment: string;
}

export function RoadmapSummary({
  completionPercent,
  targetRole,
  activeSpecialization,
  marketAlignment,
}: RoadmapSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Panel className="p-4">
        <span className="text-xs text-text-tertiary uppercase tracking-wider block">Roadmap Completion</span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl font-bold text-text font-mono">{completionPercent}%</span>
          <span className="text-xs text-text-tertiary">milestones</span>
        </div>
        <div className="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-success rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </Panel>

      <Panel className="p-4">
        <span className="text-xs text-text-tertiary uppercase tracking-wider block">Target Role</span>
        <span className="text-sm font-bold text-text mt-1.5 block truncate">{targetRole}</span>
        <span className="text-xs text-text-secondary mt-1 block truncate capitalize">{activeSpecialization}</span>
      </Panel>

      <Panel className="p-4">
        <span className="text-xs text-text-tertiary uppercase tracking-wider block">Market Alignment</span>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-xl font-bold text-success font-mono">{marketAlignment}</span>
          {marketAlignment !== '—' && <ArrowUpRight size={14} className="text-success" />}
        </div>
        <span className="text-xs text-text-tertiary mt-0.5 block">Relative skills match</span>
      </Panel>
    </div>
  );
}
