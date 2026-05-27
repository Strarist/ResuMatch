'use client';

import { useState } from 'react';
import { useStreamingCoverLetter } from '@/lib/useStreamingCoverLetter';
import { Panel, SectionHeader, StreamingBlock } from '@/components/ds';

export default function CoverLetterPage() {
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const { content, isStreaming, error, generate } = useStreamingCoverLetter();

  const handleGenerate = () => {
    if (resumeId && jobDescription.length >= 10) {
      generate({ resume_id: resumeId, job_description: jobDescription });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Cover Letter Generator" subtitle="AI-powered cover letter tailored to the job" />

      <Panel>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Resume ID"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-700 bg-transparent text-white placeholder-gray-400"
          />
          <textarea
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 rounded border border-gray-700 bg-transparent text-white placeholder-gray-400"
          />
          <button
            onClick={handleGenerate}
            disabled={isStreaming || !resumeId || jobDescription.length < 10}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg text-white transition-colors"
          >
            {isStreaming ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </div>
      </Panel>

      {error && (
        <Panel className="border-red-500/50">
          <p className="text-red-400">{error}</p>
        </Panel>
      )}

      {content && (
        <Panel>
          <StreamingBlock>{content}</StreamingBlock>
        </Panel>
      )}
    </div>
  );
}
