'use client';

import { useCallback, useRef, useState } from 'react';
import { env } from '@/lib/env';

export interface RoadmapMilestone {
  skill: string;
  effort_weeks: number;
  prerequisites: string[];
  priority: 'high' | 'medium' | 'low';
  impact_estimate: number;
  reason: string;
}

export interface RoadmapStructure {
  milestones: RoadmapMilestone[];
  total_weeks: number;
  estimated_score_improvement: number;
}

interface StreamingRoadmapState {
  structure: RoadmapStructure | null;
  aiPlan: string;
  progress: number;
  message: string;
  isStreaming: boolean;
  error: string | null;
  done: boolean;
}

/**
 * Hook for streaming skill gap roadmap generation.
 * First receives the structured roadmap, then streams the AI learning plan.
 */
export function useStreamingRoadmap() {
  const [state, setState] = useState<StreamingRoadmapState>({
    structure: null,
    aiPlan: '',
    progress: 0,
    message: '',
    isStreaming: false,
    error: null,
    done: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const generate = useCallback((resumeId: string, jobDescription: string, jobTitle?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ structure: null, aiPlan: '', progress: 0, message: 'Starting...', isStreaming: true, error: null, done: false });

    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription, job_title: jobTitle || '' }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) throw new Error(`Failed: ${response.status}`);

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
                setState((s) => ({ ...s, progress: data.progress, message: data.message }));
              } else if (type === 'roadmap.structure') {
                setState((s) => ({ ...s, structure: data as RoadmapStructure }));
              } else if (type === 'stream.token') {
                if (data.content) {
                  setState((s) => ({ ...s, aiPlan: s.aiPlan + data.content }));
                }
                if (data.done) {
                  setState((s) => ({ ...s, done: true, isStreaming: false, progress: 100 }));
                }
              } else if (type === 'stream.error') {
                setState((s) => ({ ...s, error: data.error, isStreaming: false }));
              }
            } catch { /* skip malformed */ }
          }
        }

        setState((s) => ({ ...s, isStreaming: false, done: true, progress: 100 }));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((s) => ({ ...s, error: (err as Error).message, isStreaming: false }));
        }
      }
    })();
  }, []);

  return { ...state, generate, abort };
}
