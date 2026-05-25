'use client';

import { useWorkspace } from '@/lib/WorkspaceContext';
import { Panel, SectionHeader, Skeleton } from '@/components/ds';

export default function DashboardPage() {
  const { lastAnalysis, lastRoadmap, lastCoverLetter, activeResumeId, openDrawer } = useWorkspace();

  return (
    <div className="space-y-6">
      <SectionHeader title="Workspace" subtitle="Your AI career intelligence hub" />

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/analysis"
          title="Analyze Match"
          description="Semantic resume-job scoring"
          icon="✨"
        />
        <QuickAction
          href="/roadmap"
          title="Skill Roadmap"
          description="AI-generated learning path"
          icon="🗺️"
        />
        <QuickAction
          href="/cover-letter"
          title="Cover Letter"
          description="Streaming AI generation"
          icon="✏️"
        />
      </div>

      {/* Recent Results */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Last Analysis */}
        <Panel className="cursor-pointer hover:border-accent/30 transition-colors" onClick={() => lastAnalysis && openDrawer('analysis')}>
          <SectionHeader title="Last Analysis" />
          {lastAnalysis ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="text-center">
                <span className="text-display text-text">{Math.round(lastAnalysis.overall_score)}</span>
                <p className="text-xs text-text-tertiary">Match Score</p>
              </div>
              <div className="flex-1 space-y-1">
                <MiniBar label="Skills" value={lastAnalysis.skills_score} />
                <MiniBar label="Experience" value={lastAnalysis.experience_score} />
                <MiniBar label="Education" value={lastAnalysis.education_score} />
              </div>
            </div>
          ) : (
            <EmptyState message="Run an analysis to see results here" />
          )}
        </Panel>

        {/* Last Roadmap */}
        <Panel className="cursor-pointer hover:border-accent/30 transition-colors" onClick={() => lastRoadmap && openDrawer('roadmap')}>
          <SectionHeader title="Skill Roadmap" />
          {lastRoadmap ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-4 text-small">
                <span className="text-text-secondary">{lastRoadmap.milestones.length} milestones</span>
                <span className="text-text-tertiary">•</span>
                <span className="text-text-secondary">{lastRoadmap.total_weeks} weeks</span>
                <span className="text-text-tertiary">•</span>
                <span className="text-success">+{lastRoadmap.estimated_score_improvement.toFixed(0)}%</span>
              </div>
              <div className="flex gap-1">
                {lastRoadmap.milestones.slice(0, 8).map((m) => (
                  <div
                    key={m.skill}
                    className="h-2 flex-1 rounded-full bg-accent/60"
                    title={m.skill}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="Generate a roadmap to track your progress" />
          )}
        </Panel>
      </div>

      {/* Cover Letter Preview */}
      {lastCoverLetter && (
        <Panel className="cursor-pointer hover:border-accent/30 transition-colors" onClick={() => openDrawer('cover-letter')}>
          <SectionHeader title="Cover Letter" subtitle="Click to view full text" />
          <p className="mt-2 line-clamp-3 text-small text-text-secondary">{lastCoverLetter}</p>
        </Panel>
      )}
    </div>
  );
}

function QuickAction({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-4 transition-all hover:border-accent/30 hover:bg-surface-overlay"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <span className="text-small font-medium text-text group-hover:text-accent transition-colors">{title}</span>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
    </a>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-success' : value >= 40 ? 'bg-warning' : 'bg-error';
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-text-tertiary">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-mono text-text-secondary">{Math.round(value)}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="mt-3 text-small text-text-tertiary">{message}</p>;
}
