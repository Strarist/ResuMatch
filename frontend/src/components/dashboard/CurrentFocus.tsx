import React from 'react';
import { Panel, SectionLabel, Button } from '@/components/workspace';
import { ChevronRight } from 'lucide-react';
import type { Milestone } from '@/types/dashboard';

interface CurrentFocusProps {
  milestone?: Milestone;
  topGap?: string;
  progressText?: string;
  onViewRoadmap: () => void;
}

export function CurrentFocus({ milestone, topGap, progressText, onViewRoadmap }: CurrentFocusProps) {
  return (
    <Panel className="p-6">
      <SectionLabel>Current Focus</SectionLabel>
      <div className="space-y-3 mt-4">
        <p className="text-sm font-medium">
          {milestone?.skill || milestone?.title || 'No active milestone'}
        </p>
        <p className="text-xs text-slate-400">Top Skill Gap: {topGap || 'None'}</p>
        <p className="text-xs text-slate-400">Roadmap Progress: {progressText || '-'} </p>
        <Button onClick={onViewRoadmap} variant="outline" className="mt-2">
          View Roadmap <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </Panel>
  );
}
