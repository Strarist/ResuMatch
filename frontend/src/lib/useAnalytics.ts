'use client';

import { useCallback, useRef } from 'react';

/**
 * Lightweight product analytics hook.
 *
 * Privacy principles:
 * - No PII (no emails, names, resume content)
 * - Only tracks: action name, duration, success/failure, counts
 * - Events batched and sent async (never blocks UI)
 * - Graceful failure (analytics errors are silently swallowed)
 *
 * Event taxonomy:
 * - analysis.started / analysis.completed / analysis.failed
 * - generation.cover_letter / generation.roadmap
 * - stream.started / stream.completed / stream.cancelled
 * - workspace.navigation / workspace.command_palette
 */

interface AnalyticsEvent {
  action: string;
  duration_ms?: number;
  success?: boolean;
  metadata?: Record<string, string | number | boolean>;
}

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 30_000; // 30s

let eventBuffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (eventBuffer.length === 0) return;
  const batch = [...eventBuffer];
  eventBuffer = [];

  // Fire-and-forget: send to backend telemetry endpoint
  // In production, this would go to PostHog/Amplitude/custom endpoint
  // For now, log to console in development only
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', batch);
  }

  // Future: send to /v1/telemetry or PostHog
  // fetch('/v1/telemetry', { method: 'POST', body: JSON.stringify(batch) }).catch(() => {});
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flush();
    flushTimer = null;
  }, FLUSH_INTERVAL_MS);
}

function trackEvent(event: AnalyticsEvent) {
  eventBuffer.push({ ...event, duration_ms: event.duration_ms ?? 0, success: event.success ?? true });
  if (eventBuffer.length >= BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Hook for tracking product analytics events.
 *
 * Usage:
 *   const { track, trackTimed } = useAnalytics();
 *   track('analysis.started');
 *   const stop = trackTimed('analysis');
 *   // ... do work ...
 *   stop(true); // success
 */
export function useAnalytics() {
  const timers = useRef<Map<string, number>>(new Map());

  const track = useCallback((action: string, metadata?: Record<string, string | number | boolean>) => {
    trackEvent({ action, metadata });
  }, []);

  const trackTimed = useCallback((action: string) => {
    const start = performance.now();
    timers.current.set(action, start);

    return (success: boolean = true) => {
      const startTime = timers.current.get(action);
      if (startTime === undefined) return;
      const duration_ms = performance.now() - startTime;
      timers.current.delete(action);
      trackEvent({ action: `${action}.completed`, duration_ms, success });
    };
  }, []);

  return { track, trackTimed };
}
