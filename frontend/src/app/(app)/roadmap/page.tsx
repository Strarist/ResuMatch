'use client';

/** @deprecated Legacy job-description SSE roadmap. Use /roadmap-v2 with roadmap-intel API instead. */

import { useState } from 'react';
import { useStreamingRoadmap } from '@/lib/useStreamingRoadmap';
import { Panel, SectionHeader, StreamingBlock } from '@/components/ds';
import { RoadmapTimeline } from '@/components/roadmap/RoadmapTimeline';

export default function RoadmapPage() {
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const { structure, aiPlan, progress, message, isStreaming, error, done, generate } = useStreamingRoadmap();

  const handleGenerate = () => {
    if (resumeId && jobDescription.length >= 10) {
      generate(resumeId, jobDescription, jobTitle);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Skill Roadmap" subtitle="AI-generated career progression plan" />

      {/* Input */}
      <Panel>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-small font-medium text-text-secondary">Resume ID</label>
              <input
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                placeholder="Resume UUID..."
                className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-body text-text outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-small font-medium text-text-secondary">Target Role</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-body text-text outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-small font-medium text-text-secondary">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description..."
              rows={4}
              className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-body text-text outline-none focus:border-accent resize-none"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isStreaming || !resumeId || jobDescription.length < 10}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-small font-medium text-text-inverse hover:bg-accent-hover disabled:opacity-50"
        >
          {isStreaming ? 'Generating...' : 'Generate Roadmap'}
        </button>
      </Panel>

      {/* Progress */}
      {isStreaming && !structure && (
        <Panel variant="inset">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse-subtle rounded-full bg-accent" />
            <span className="text-small text-text-secondary">{message || 'Analyzing...'}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-inset">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </Panel>
      )}

      {/* Error */}
      {error && (
        <Panel variant="inset">
          <p className="text-small text-error">{error}</p>
        </Panel>
      )}

      {/* Roadmap Structure */}
      {structure && (
        <div className="animate-fade-in space-y-6">
          <RoadmapTimeline
            milestones={structure.milestones}
            totalWeeks={structure.total_weeks}
            scoreImprovement={structure.estimated_score_improvement}
          />

          {/* AI Learning Plan (streamed) */}
          {(aiPlan || isStreaming) && (
            <Panel>
              <SectionHeader title="Learning Plan" subtitle="AI-generated strategy" />
              <div className="mt-4">
                <StreamingBlock isStreaming={isStreaming && !done}>
                  {aiPlan || 'Generating learning plan...'}
                </StreamingBlock>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
