'use client';

import { useCallback, useRef, useState } from 'react';
import { env } from '@/lib/env';

export type CoverLetterTone = 'professional' | 'technical' | 'concise' | 'startup' | 'enterprise';

interface CoverLetterRequest {
  resume_id: string;
  job_description: string;
  job_title?: string;
  company?: string;
  tone?: CoverLetterTone;
}

interface StreamingCoverLetterState {
  content: string;
  isStreaming: boolean;
  error: string | null;
  done: boolean;
}

/**
 * Hook for streaming cover letter generation.
 * Accumulates tokens into a growing string for live rendering.
 */
export function useStreamingCoverLetter() {
  const [state, setState] = useState<StreamingCoverLetterState>({
    content: '',
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

  const generate = useCallback((request: CoverLetterRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ content: '', isStreaming: true, error: null, done: false });

    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/cover-letter/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Generation failed: ${response.status}`);
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
              if (event.type === 'stream.token') {
                const chunk = event.data.content;
                const isDone = event.data.done;
                if (chunk) {
                  setState((s) => ({ ...s, content: s.content + chunk }));
                }
                if (isDone) {
                  setState((s) => ({ ...s, done: true, isStreaming: false }));
                }
              } else if (event.type === 'stream.error') {
                setState((s) => ({ ...s, error: event.data.error, isStreaming: false }));
              }
            } catch {
              // Skip malformed
            }
          }
        }

        // Stream ended without explicit done
        setState((s) => ({ ...s, isStreaming: false, done: true }));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((s) => ({ ...s, error: (err as Error).message, isStreaming: false }));
        }
      }
    })();
  }, []);

  return { ...state, generate, abort };
}
