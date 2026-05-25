'use client';

import { useCallback, useRef, useState } from 'react';
import { SSEEventSchema, type SSEEvent, type SSEEventType } from '@resumatch/types/sse';

type EventHandler<T extends SSEEventType> = (
  event: Extract<SSEEvent, { type: T }>
) => void;

type EventHandlers = {
  [K in SSEEventType]?: EventHandler<K>;
};

interface UseSSEOptions {
  /** Called on any event regardless of type */
  onEvent?: (event: SSEEvent) => void;
  /** Called when the stream ends (complete or error) */
  onDone?: () => void;
  /** Called on connection/parse errors */
  onError?: (error: Error) => void;
  /** Typed handlers per event type */
  handlers?: EventHandlers;
}

interface UseSSEReturn {
  /** Start streaming from a POST endpoint */
  start: (url: string, body: unknown) => void;
  /** Abort the current stream */
  abort: () => void;
  /** Whether a stream is currently active */
  isStreaming: boolean;
  /** Last error encountered */
  error: Error | null;
}

/**
 * React hook for consuming typed SSE streams from POST endpoints.
 *
 * Uses fetch() instead of EventSource because:
 * - EventSource only supports GET requests
 * - We need to POST the analysis request body
 * - We need Authorization headers
 *
 * Handles: reconnection, cleanup, abort, typed parsing.
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const start = useCallback(
    (url: string, body: unknown) => {
      // Abort any existing stream
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setError(null);

      (async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`Stream failed: ${response.status}`);
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
              const json = line.slice(6);
              try {
                const event = SSEEventSchema.parse(JSON.parse(json));
                options.onEvent?.(event);

                // Dispatch to typed handler
                const handler = options.handlers?.[event.type];
                if (handler) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (handler as (e: any) => void)(event);
                }
              } catch {
                // Skip malformed events
              }
            }
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
            options.onError?.(e);
          }
        } finally {
          setIsStreaming(false);
          options.onDone?.();
        }
      })();
    },
    [options]
  );

  return { start, abort, isStreaming, error };
}
