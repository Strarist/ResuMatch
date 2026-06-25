import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Milestone } from '@/types/dashboard';

interface CurrentFocusProps {
  milestone?: Milestone;
  topGap?: string;
  progressText?: string;
  onViewRoadmap: () => void;
}

export function CurrentFocus({ milestone, topGap, progressText, onViewRoadmap }: CurrentFocusProps) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-raised via-surface-raised to-emerald-500/5 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 mb-3">Current Focus</p>
      <div className="space-y-3">
        <p className="text-base font-semibold text-text">
          {milestone?.skill || milestone?.title || 'No active milestone'}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-surface-inset/80 border border-border/60 px-3 py-2">
            <span className="text-text-tertiary block mb-0.5">Top Skill Gap</span>
            <span className="text-text font-medium">{topGap || 'None'}</span>
          </div>
          <div className="rounded-lg bg-surface-inset/80 border border-border/60 px-3 py-2">
            <span className="text-text-tertiary block mb-0.5">Roadmap Progress</span>
            <span className="text-text font-medium">{progressText || '—'}</span>
          </div>
        </div>
        <Button onClick={onViewRoadmap} variant="outline" className="mt-1 border-emerald-500/30 hover:bg-emerald-500/10">
          View Roadmap <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
