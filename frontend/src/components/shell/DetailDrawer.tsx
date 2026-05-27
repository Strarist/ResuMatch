'use client';

import { useWorkspace } from '@/lib/WorkspaceContext';
import { SectionHeader, StreamingBlock } from '@/components/ds';
import { cn } from '@/lib/utils';

/**
 * DetailDrawer: Slide-in contextual panel showing cached AI results.
 * Allows viewing analysis/roadmap/cover-letter without leaving current page.
 */
export function DetailDrawer() {
  const { drawerOpen, drawerContent, lastAnalysis, lastRoadmap, lastCoverLetter, closeDrawer } = useWorkspace();

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={closeDrawer} />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-surface-raised',
          'transform transition-transform duration-300 ease-out-expo overflow-y-auto',
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-raised px-5 py-3">
          <span className="text-small font-medium text-text capitalize">{drawerContent ?? 'Details'}</span>
          <button onClick={closeDrawer} className="rounded-md p-1 text-text-tertiary hover:bg-surface-overlay hover:text-text">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {drawerContent === 'analysis' && lastAnalysis && (
            <>
              <SectionHeader title="Last Analysis" subtitle={lastAnalysis.resume_id} />
              <div className="grid grid-cols-2 gap-3">
                <ScoreCard label="Overall" value={lastAnalysis.overall_score} />
                <ScoreCard label="Skills" value={lastAnalysis.skills_score} />
                <ScoreCard label="Experience" value={lastAnalysis.experience_score} />
                <ScoreCard label="Education" value={lastAnalysis.education_score} />
              </div>
              {lastAnalysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">Top Recommendation</span>
                  <p className="text-small text-text-secondary">{lastAnalysis.recommendations[0]?.description}</p>
                </div>
              )}
            </>
          )}

          {drawerContent === 'roadmap' && lastRoadmap && (
            <>
              <SectionHeader title="Roadmap" subtitle={`${lastRoadmap.milestones.length} milestones`} />
              <div className="space-y-2">
                {lastRoadmap.milestones.slice(0, 5).map((m) => (
                  <div key={m.skill} className="flex items-center justify-between rounded-lg bg-surface-inset px-3 py-2">
                    <span className="text-small text-text">{m.skill}</span>
                    <span className="text-xs text-text-tertiary">{m.effort_weeks}w</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {drawerContent === 'cover-letter' && lastCoverLetter && (
            <>
              <SectionHeader title="Cover Letter" />
              <StreamingBlock>{lastCoverLetter}</StreamingBlock>
            </>
          )}

          {!drawerContent && (
            <p className="text-small text-text-tertiary">No content selected.</p>
          )}
        </div>
      </aside>
    </>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-success' : value >= 40 ? 'text-warning' : 'text-error';
  return (
    <div className="rounded-lg bg-surface-inset p-3 text-center">
      <span className={cn('text-h2 font-semibold', color)}>{Math.round(value)}</span>
      <p className="text-xs text-text-tertiary">{label}</p>
    </div>
  );
}
