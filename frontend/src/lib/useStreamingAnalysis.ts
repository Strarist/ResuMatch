'use client';

import { useCallback, useRef, useState } from 'react';
import { env } from '@/lib/env';

/** Analysis stages in order */
export type AnalysisStage = 'idle' | 'parsing' | 'matching' | 'scoring' | 'recommendations' | 'complete' | 'error';

export interface AnalysisProgress {
  stage: AnalysisStage;
  progress: number;
  message: string;
}

export interface AnalysisResult {
  resume_id: string;
  overall_score: number;
  confidence: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  seniority_score: number;
  explanations: Record<string, string>;
  skill_matching: {
    matched_skills: Array<{ resume_skill: string; job_skill: string; score: number }>;
    missing_skills: string[];
    extra_skills: string[];
    match_percentage: number;
  };
  recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    impact?: string;
    skills?: string[];
  }>;
}

interface StreamingAnalysisState {
  stage: AnalysisStage;
  progress: number;
  message: string;
  result: AnalysisResult | null;
  error: string | null;
  isStreaming: boolean;
}

/**
 * Hook for streaming resume analysis with real-time progress.
 *
 * State machine: idle → parsing → matching → scoring → recommendations → complete
 *                                                                      → error (from any stage)
 */
export function useStreamingAnalysis() {
  const [state, setState] = useState<StreamingAnalysisState>({
    stage: 'idle',
    progress: 0,
    message: '',
    result: null,
    error: null,
    isStreaming: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false, stage: 'idle' }));
  }, []);

  const analyze = useCallback((resumeId: string, jobDescription: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      stage: 'parsing',
      progress: 0,
      message: 'Starting analysis...',
      result: null,
      error: null,
      isStreaming: true,
    });

    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/analyze/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Analysis failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              const { type, data } = event;

              if (type === 'analysis.progress') {
                setState((s) => ({
                  ...s,
                  stage: data.stage as AnalysisStage,
                  progress: data.progress,
                  message: data.message,
                }));
              } else if (type === 'analysis.complete') {
                setState({
                  stage: 'complete',
                  progress: 100,
                  message: 'Analysis complete',
                  result: data as AnalysisResult,
                  error: null,
                  isStreaming: false,
                });
              } else if (type === 'analysis.error') {
                setState((s) => ({
                  ...s,
                  stage: 'error',
                  error: data.error,
                  isStreaming: false,
                }));
              }
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((s) => ({
            ...s,
            stage: 'error',
            error: (err as Error).message,
            isStreaming: false,
          }));
        }
      }
    })();
  }, []);

  return { ...state, analyze, abort };
}
