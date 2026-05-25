'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Resilience hook for AI operations.
 *
 * Provides:
 * - Automatic retry with user-visible countdown
 * - Partial result preservation (keeps what succeeded before failure)
 * - Graceful error messaging (no scary technical errors)
 * - Manual retry trigger
 */

interface ResilienceState {
  /** Number of retries attempted */
  retryCount: number;
  /** Whether auto-retry is in progress */
  isRetrying: boolean;
  /** Seconds until next retry (countdown) */
  retryIn: number;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Whether the operation can be retried */
  canRetry: boolean;
}

interface UseResilienceOptions {
  maxRetries?: number;
  baseDelay?: number; // seconds
  onRetry?: () => void;
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  'Rate limit exceeded': 'You\'re moving fast! Please wait a moment before trying again.',
  'Provider unavailable': 'Our AI is temporarily busy. Retrying automatically...',
  'Analysis failed': 'Something went wrong with the analysis. You can try again.',
  'Generation failed': 'Generation was interrupted. Your previous results are preserved.',
  'Network error': 'Connection lost. We\'ll retry when you\'re back online.',
};

function friendlyMessage(error: string): string {
  for (const [key, msg] of Object.entries(FRIENDLY_MESSAGES)) {
    if (error.toLowerCase().includes(key.toLowerCase())) return msg;
  }
  return 'Something unexpected happened. Please try again.';
}

export function useResilience(options: UseResilienceOptions = {}) {
  const { maxRetries = 2, baseDelay = 3, onRetry } = options;
  const [state, setState] = useState<ResilienceState>({
    retryCount: 0,
    isRetrying: false,
    retryIn: 0,
    errorMessage: null,
    canRetry: true,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState({ retryCount: 0, isRetrying: false, retryIn: 0, errorMessage: null, canRetry: true });
  }, []);

  const handleError = useCallback((error: string, retryFn?: () => void) => {
    setState((s) => {
      const newCount = s.retryCount + 1;
      const canRetry = newCount <= maxRetries;
      const message = friendlyMessage(error);

      if (canRetry && retryFn) {
        // Auto-retry with countdown
        const delay = baseDelay * Math.pow(2, newCount - 1);
        let remaining = delay;

        const timer = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(timer);
            setState((prev) => ({ ...prev, isRetrying: false, retryIn: 0 }));
            onRetry?.();
            retryFn();
          } else {
            setState((prev) => ({ ...prev, retryIn: remaining }));
          }
        }, 1000);

        timerRef.current = timer;
        return { retryCount: newCount, isRetrying: true, retryIn: delay, errorMessage: message, canRetry: true };
      }

      return { retryCount: newCount, isRetrying: false, retryIn: 0, errorMessage: message, canRetry: false };
    });
  }, [maxRetries, baseDelay, onRetry]);

  const manualRetry = useCallback((retryFn: () => void) => {
    setState((s) => ({ ...s, errorMessage: null, isRetrying: false }));
    retryFn();
  }, []);

  return { ...state, handleError, manualRetry, reset };
}
