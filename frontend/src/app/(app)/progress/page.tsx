'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { EmptyState } from '@/components/workspace';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { progress as progressApi, type ProgressSnapshot } from '@/lib/intelligence-client';
import { TrendingUp } from 'lucide-react';

export default function ProgressPage() {
  const [apiData, setApiData] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const { simulationActive, metrics, roadmap } = useLivingSystem();

  const fetchData = useCallback(async () => {
    try {
      const data = await progressApi.getSnapshot();
      setApiData(data);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchData]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>;

  // Resolve counts for completed/deferred nodes in simulation
  const completedCount = simulationActive ? roadmap.filter(n => n.status === 'completed').length : 0;
  const deferredCount = simulationActive ? roadmap.filter(n => n.status === 'deferred').length : 0;

  // Resolve active telemetry progress data
  const data: ProgressSnapshot | null = simulationActive
    ? {
        execution: {
          momentum_score: metrics.careerVelocity / 100,
          execution_consistency: 0.92,
          completion_velocity: completedCount + deferredCount > 0 ? completedCount / (completedCount + deferredCount) : 0.75,
          acceptance_rate: 0.88,
          stagnation_risk: 'low',
          stagnation_signals: [],
          burnout_risk: 'low',
          growth_acceleration: metrics.marketFit / 100,
          execution_style: 'sprinter',
          days_since_activity: 0,
          completed_count: completedCount,
          deferred_count: deferredCount,
        },
        risks: {
          risk_score: 0.24,
          primary_risks: [
            { type: 'skill_drift', severity: 'medium', detail: 'Hiring requirements for AI Platform Architects are shifting toward Triton compiler custom bindings.', mitigation: 'Track Triton compiler releases and review compiler optimization roadmap nodes.' },
          ],
        },
        interventions: [
          { type: 'recalibration', title: 'Prioritize CUDA Kernel Tuning', explanation: 'Complete the CUDA roadmap node to immediately unlock 4 matching pipelines.', priority: 'high', estimated_impact: '+12% readiness boost' },
        ],
        summary: {
          dominant_path: 'AI & Distributed Systems Platform Infrastructure',
          competitiveness: metrics.matchScore / 100,
          focus_areas: ['CUDA optimizations', 'Consensus protocols'],
        },
      }
    : apiData;

  if (!data) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Progress" subtitle="Behavioral execution intelligence" />
        <EmptyState
          icon={TrendingUp}
          title="Progress Tracker Standby"
          description="Synthesize profile metrics or load simulated workload to audit velocity, consistency, and momentum parameters."
        />
      </div>
    );
  }

  const { execution: ex, risks, interventions } = data;
  const styleColors: Record<string, "error" | "success" | "warning" | "info" | "neutral"> = { sprinter: 'success', highly_disciplined: 'success', optimizer: 'info', explorer: 'warning', recovering: 'warning', inconsistent: 'error' };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Progress"
        subtitle={simulationActive ? "Behavioral execution intelligence (Simulation Sandbox)" : "Behavioral execution intelligence"}
      />

      {/* Stagnation Alert */}
      {ex.stagnation_risk === 'high' && (
        <Panel className="border-red-500/50 bg-red-500/5">
          <p className="text-sm text-red-400 font-medium">⚠ High stagnation risk detected</p>
          {ex.stagnation_signals.map((s, i) => <p key={i} className="text-xs text-red-300 mt-1">• {s.detail}</p>)}
        </Panel>
      )}

      {/* Top Metrics */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Execution Momentum</p>
          <p className="text-2xl font-bold text-accent font-mono transition-all duration-700">{Math.round(ex.momentum_score * 100)}%</p>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Execution Style</p>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={styleColors[ex.execution_style] || 'neutral'}>{ex.execution_style.replace(/_/g, ' ').toUpperCase()}</StatusBadge>
          </div>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Milestone Completion</p>
          <p className="text-2xl font-bold text-white font-mono transition-all duration-700">{Math.round(ex.completion_velocity * 100)}%</p>
          <p className="text-[9px] text-white/20 mt-1 font-mono uppercase">{ex.completed_count} done / {ex.deferred_count} skipped</p>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Growth Acceleration</p>
          <p className="text-2xl font-bold text-success font-mono transition-all duration-700">{Math.round(ex.growth_acceleration * 100)}%</p>
        </Panel>
      </div>

      {/* Interventions */}
      {interventions.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Active Path Interventions" />
          <div className="mt-3 space-y-3">
            {interventions.map((iv, i) => (
              <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.005] hover:border-white/[0.08] transition-all p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white/80">{iv.title}</span>
                  <StatusBadge status={iv.priority === 'high' ? 'error' : 'warning'}>{iv.priority.toUpperCase()}</StatusBadge>
                </div>
                <p className="text-xs text-white/35 leading-relaxed">{iv.explanation}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Risk Profile */}
      {risks.primary_risks.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="System Risk Profile" />
          <div className="mt-3 space-y-2">
            {risks.primary_risks.map((r, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.005] px-1.5 rounded transition-all">
                <StatusBadge status={r.severity === 'high' ? 'error' : 'warning'}>{r.severity.toUpperCase()}</StatusBadge>
                <div>
                  <p className="text-xs font-semibold text-white/70">{r.detail}</p>
                  <p className="text-xs text-white/30 mt-1 font-mono uppercase">Mitigation: {r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Execution Details */}
      <Panel className="border-white/[0.04] bg-white/[0.015]">
        <SectionHeader title="Execution Sub-System Diagnostics" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Consistency Rating', value: ex.execution_consistency },
            { label: 'Acceptance Rate', value: ex.acceptance_rate },
            { label: 'Momentum Index', value: ex.momentum_score },
            { label: 'Growth Vector', value: ex.growth_acceleration },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-36 font-medium">{label}</span>
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
              <span className="text-xs text-white/35 font-mono w-8 text-right">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
