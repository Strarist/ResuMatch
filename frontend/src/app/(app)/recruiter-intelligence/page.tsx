'use client';

import { useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

interface Signal {
  signal: string;
  confidence: number;
  label: string;
  evidence: string[];
}

interface ReasoningTrace {
  claim: string;
  confidence: number;
  evidence: string[];
  reasoning_path: string[];
}

interface IntelligenceData {
  summary: {
    headline: string;
    specialization: string[];
    strength_count: number;
    risk_count: number;
    overall_confidence: string;
  };
  strengths: Signal[];
  risks: Signal[];
  confidence: Record<string, number>;
}

export default function RecruiterIntelligencePage() {
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [reasoning, setReasoning] = useState<ReasoningTrace[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/recruiter/intelligence`, { headers }).then(r => r.json()),
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/recruiter/reasoning`, { headers }).then(r => r.json()),
    ]).then(([i, r]) => {
      setIntel(i.intelligence);
      setReasoning(r.reasoning || []);
    }).catch(() => {});
  }, []);

  if (!intel) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Recruiter Intelligence" subtitle="Evidence-backed candidate assessment" />
        <Panel variant="inset" className="py-12 text-center">
          <p className="text-text-secondary">Run an analysis to generate recruiter intelligence.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Recruiter Intelligence" subtitle="Evidence-backed candidate assessment" />

      {/* Headline */}
      <Panel variant="raised">
        <p className="text-h2 font-semibold text-text">{intel.summary.headline}</p>
        <div className="mt-2 flex items-center gap-3">
          {intel.summary.specialization.map(s => (
            <span key={s} className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent capitalize">{s}</span>
          ))}
          <StatusBadge status={intel.summary.overall_confidence === 'high' ? 'success' : intel.summary.overall_confidence === 'moderate' ? 'warning' : 'neutral'}>
            {intel.summary.overall_confidence} confidence
          </StatusBadge>
        </div>
      </Panel>

      {/* Strengths */}
      {intel.strengths.length > 0 && (
        <Panel>
          <SectionHeader title="Strength Signals" subtitle={`${intel.strengths.length} detected`} />
          <div className="mt-4 space-y-3">
            {intel.strengths.map((s, i) => (
              <SignalCard key={i} signal={s} variant="strength" />
            ))}
          </div>
        </Panel>
      )}

      {/* Risks */}
      {intel.risks.length > 0 && (
        <Panel>
          <SectionHeader title="Growth Areas" subtitle="Opportunities for improvement" />
          <div className="mt-4 space-y-3">
            {intel.risks.map((r, i) => (
              <SignalCard key={i} signal={r} variant="risk" />
            ))}
          </div>
        </Panel>
      )}

      {/* Reasoning */}
      {reasoning.length > 0 && (
        <Panel>
          <SectionHeader title="Reasoning Traces" subtitle="How conclusions were reached" />
          <div className="mt-4 space-y-4">
            {reasoning.map((r, i) => (
              <div key={i} className="rounded-lg border border-border-subtle bg-surface-inset p-4">
                <div className="flex items-center justify-between">
                  <span className="text-small font-medium text-text">{r.claim}</span>
                  <ConfidenceDot confidence={r.confidence} />
                </div>
                <div className="mt-2 space-y-1">
                  {r.evidence.map((e, j) => (
                    <p key={j} className="text-xs text-text-secondary">• {e}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function SignalCard({ signal, variant }: { signal: Signal; variant: 'strength' | 'risk' }) {
  return (
    <div className={cn(
      'rounded-lg border p-4',
      variant === 'strength' ? 'border-success/20 bg-success/5' : 'border-border-subtle bg-surface-inset'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-small font-medium text-text">{signal.signal}</span>
        <ConfidenceDot confidence={signal.confidence} />
      </div>
      {signal.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {signal.evidence.map((e, i) => (
            <span key={i} className="rounded bg-surface-raised px-2 py-0.5 text-xs text-text-secondary">{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 0.7 ? 'bg-success' : confidence >= 0.4 ? 'bg-warning' : 'bg-text-tertiary';
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2 w-2 rounded-full', color)} />
      <span className="text-xs text-text-tertiary">{(confidence * 100).toFixed(0)}%</span>
    </div>
  );
}
