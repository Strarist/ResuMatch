'use client';

import Link from 'next/link';
import { Panel } from '@/components/ds';
import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

export interface AlignmentItem {
  role: string;
  company: string;
  match: string;
  window: string;
  readiness: string;
  comp: string;
  shift: string;
}

interface RoadmapInsightsSidebarProps {
  topGapSkill?: string;
  hasOpenGaps: boolean;
  alignments: AlignmentItem[];
  isSimulation: boolean;
}

export function RoadmapInsightsSidebar({
  topGapSkill,
  hasOpenGaps,
  alignments,
  isSimulation,
}: RoadmapInsightsSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Insights</h3>
      </div>

      <Panel className="p-4 space-y-3">
        <span className="text-xs text-text-tertiary uppercase font-semibold block">Key Recommendation</span>
        {hasOpenGaps && topGapSkill ? (
          <div className="p-3 rounded-lg border border-error/10 bg-error/5 flex items-start gap-2 text-small text-error">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <p>
              Hiring managers expect <strong>{topGapSkill}</strong> validation. Bridging this gap improves interview potential.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-success/10 bg-success/5 flex items-start gap-2 text-small text-success">
            <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
            <p>All core skill gaps are addressed for your target career path.</p>
          </div>
        )}
      </Panel>

      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Opportunities</h3>
      </div>

      {alignments.length > 0 ? (
        <div className="space-y-3">
          {alignments.map((a, idx) => (
            <Panel key={idx} className="p-4 hover:bg-surface-inset transition-colors">
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <span className="text-sm font-semibold text-text">{a.role}</span>
                  <span className="text-xs text-text-secondary block mt-0.5">@ {a.company}</span>
                </div>
                <span className="text-sm text-success font-bold font-mono">{a.match}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-tertiary mt-3 border-t border-border-subtle pt-2">
                <div>Skills: <strong className="text-text-secondary">{a.readiness}</strong></div>
                <div>Status: <strong className="text-text-secondary">{a.window}</strong></div>
                <div>Salary: <strong className="text-text-secondary">{a.comp}</strong></div>
                <div>Demand: <strong className="text-success">{a.shift}</strong></div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel className="p-4">
          <p className="text-small text-text-secondary leading-relaxed">
            {isSimulation
              ? 'Complete outstanding milestones to unlock matching opportunities.'
              : 'View roles aligned with your career path and skill profile.'}
          </p>
          <Link
            href="/opportunities"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Browse Opportunities
            <ChevronRight size={14} />
          </Link>
        </Panel>
      )}
    </div>
  );
}
