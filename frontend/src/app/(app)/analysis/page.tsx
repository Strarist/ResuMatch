'use client';

import { useState } from 'react';
import { useStreamingAnalysis } from '@/lib/useStreamingAnalysis';
import { Panel, ScoreRing, SectionHeader, StreamingBlock } from '@/components/ds';
import { AnalysisTimeline } from '@/components/analysis/AnalysisTimeline';
import { SkillMatchGrid } from '@/components/analysis/SkillMatchGrid';

export default function AnalysisPage() {
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const { stage, progress, message, result, error, isStreaming, analyze } = useStreamingAnalysis();

  const handleAnalyze = () => {
    if (resumeId && jobDescription.length >= 10) {
      analyze(resumeId, jobDescription);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="AI Analysis" subtitle="Semantic resume-job matching with real-time scoring" />

      {/* Input Panel */}
      <Panel>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-small font-medium text-text-secondary">Resume ID</label>
            <input
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              placeholder="Paste resume UUID..."
              className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-body text-text outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-small font-medium text-text-secondary">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={5}
              className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2 text-body text-text outline-none focus:border-accent resize-none"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isStreaming || !resumeId || jobDescription.length < 10}
            className="rounded-lg bg-accent px-4 py-2 text-small font-medium text-text-inverse transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isStreaming ? 'Analyzing...' : 'Analyze Match'}
          </button>
        </div>
      </Panel>

      {/* Streaming Progress */}
      {stage !== 'idle' && stage !== 'complete' && !error && (
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
          <Panel variant="inset">
            <p className="text-small text-text-secondary">{message}</p>
          </Panel>
          <Panel>
            <AnalysisTimeline currentStage={stage} progress={progress} />
          </Panel>
        </div>
      )}

      {/* Error */}
      {error && (
        <Panel variant="inset">
          <p className="text-small text-error">{error}</p>
        </Panel>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Score Overview */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Panel className="flex flex-col items-center py-5">
              <ScoreRing score={result.overall_score} size={72} />
              <span className="mt-2 text-xs text-text-tertiary">Overall</span>
            </Panel>
            <Panel className="flex flex-col items-center py-5">
              <ScoreRing score={result.skills_score} size={60} />
              <span className="mt-2 text-xs text-text-tertiary">Skills</span>
            </Panel>
            <Panel className="flex flex-col items-center py-5">
              <ScoreRing score={result.experience_score} size={60} />
              <span className="mt-2 text-xs text-text-tertiary">Experience</span>
            </Panel>
            <Panel className="flex flex-col items-center py-5">
              <ScoreRing score={result.education_score} size={60} />
              <span className="mt-2 text-xs text-text-tertiary">Education</span>
            </Panel>
          </div>

          {/* Skill Matching */}
          <Panel>
            <SectionHeader title="Skill Matching" subtitle="Semantic similarity analysis" />
            <div className="mt-4">
              <SkillMatchGrid
                matched={result.skill_matching.matched_skills}
                missing={result.skill_matching.missing_skills}
                extra={result.skill_matching.extra_skills}
                matchPercentage={result.skill_matching.match_percentage}
              />
            </div>
          </Panel>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Panel>
              <SectionHeader title="Recommendations" subtitle="Actionable improvement suggestions" />
              <div className="mt-4 space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="rounded-lg border border-border-subtle bg-surface-inset p-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${rec.priority === 'high' ? 'bg-error' : rec.priority === 'medium' ? 'bg-warning' : 'bg-info'}`} />
                      <span className="text-small font-medium text-text">{rec.title}</span>
                    </div>
                    <p className="mt-1 text-small text-text-secondary">{rec.description}</p>
                    {rec.impact && <p className="mt-1 text-xs text-text-tertiary">{rec.impact}</p>}
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
