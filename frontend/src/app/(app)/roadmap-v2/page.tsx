'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Zap, CheckCircle2, AlertTriangle, ArrowUpRight, Info } from 'lucide-react';

interface RoadmapNode {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  effort_weeks: number;
  impact_estimate: number;
  reason: string;
  status: 'active' | 'completed' | 'deferred';
  dependency?: string;
  recommended_sprint?: string;
}

interface GapItem {
  skill: string;
  demand: string;
  priority: number;
  urgency: string;
  weight: string;
}

interface AlignmentItem {
  role: string;
  company: string;
  match: string;
  window: string;
  readiness: string;
  comp: string;
  shift: string;
}

export default function AdaptiveRoadmapPage() {
  const [apiState, setApiState] = useState<{ target_role: string; version: number; milestones: RoadmapNode[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    simulationActive,
    roadmap: simRoadmap,
    completeRoadmapNode,
    deferRoadmapNode,
    triggerSystemScan,
    systemStatus,
    metrics,
    opportunities: simOpportunities
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/state`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.state) {
          interface RawMilestone {
            skill: string;
            priority?: 'high' | 'medium' | 'low';
            effort_weeks?: number;
            impact_estimate?: number;
            reason?: string;
            status?: 'active' | 'completed' | 'deferred';
            dependency?: string;
            recommended_sprint?: string;
          }
          setApiState({
            target_role: d.state.target_role,
            version: d.state.version,
            milestones: d.state.snapshot?.milestones?.map((m: RawMilestone) => ({
              skill: m.skill,
              priority: m.priority || 'medium',
              effort_weeks: m.effort_weeks || 4,
              impact_estimate: m.impact_estimate || 80,
              reason: m.reason || '',
              status: m.status || 'active',
              dependency: m.dependency || (m.priority === 'high' ? 'None' : 'Core Language Stack'),
              recommended_sprint: m.recommended_sprint || `Sprint: ${m.skill} foundations`,
            })) || [],
          });
        }
      }
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

  const markComplete = async (skill: string) => {
    if (simulationActive || !apiState) {
      completeRoadmapNode(skill);
      return;
    }
    const token = localStorage.getItem('access_token');
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/node/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ skill }),
    });
    fetchData();
  };

  const markDeferred = async (skill: string) => {
    if (simulationActive || !apiState) {
      deferRoadmapNode(skill);
      return;
    }
    const token = localStorage.getItem('access_token');
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/node/defer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ skill }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        <span className="text-xs text-white/30 font-mono">Loading adaptive roadmap...</span>
      </div>
    );
  }

  // --- DORMANT/FALLBACK BASELINE DATASETS ---
  const fallbackMilestones: RoadmapNode[] = [
    {
      skill: 'Kubernetes Operator Design & Controllers',
      priority: 'high',
      effort_weeks: 4,
      impact_estimate: 88,
      reason: 'Required for orchestrating complex model serving layers in target roles.',
      status: 'active',
      dependency: 'Go Concurrency Model',
      recommended_sprint: 'Sprint 1: Controller Reconciliation Loop'
    },
    {
      skill: 'Go Concurrency Model & Goroutines',
      priority: 'high',
      effort_weeks: 2,
      impact_estimate: 92,
      reason: 'Core language requirement for high-throughput backend services.',
      status: 'completed',
      dependency: 'None',
      recommended_sprint: 'Completed'
    },
    {
      skill: 'Distributed Caching (Redis/Memcached)',
      priority: 'medium',
      effort_weeks: 3,
      impact_estimate: 82,
      reason: 'Optimizes query path latency and reduces database read pressure.',
      status: 'active',
      dependency: 'Go Concurrency Model',
      recommended_sprint: 'Sprint 2: Cache-Aside Pattern Implementation'
    },
    {
      skill: 'gRPC & Protocol Buffers',
      priority: 'low',
      effort_weeks: 2,
      impact_estimate: 75,
      reason: 'Standard communication layer for low-latency microservices.',
      status: 'active',
      dependency: 'None',
      recommended_sprint: 'Sprint 3: RPC Schema Definition & Client Code Generation'
    }
  ];

  const fallbackGaps: GapItem[] = [
    { skill: 'CUDA Kernel Optimization', demand: '95% (High)', priority: 1, urgency: 'Immediate', weight: '30%' },
    { skill: 'Raft Consensus Protocols', demand: '92% (High)', priority: 2, urgency: 'High', weight: '25%' },
    { skill: 'vLLM Serving Optimization', demand: '85% (Medium)', priority: 3, urgency: 'Medium', weight: '15%' }
  ];

  const fallbackAlignments: AlignmentItem[] = [
    { role: 'Principal AI Platform Architect', company: 'Vercel', match: '95%', window: '2-4 weeks', readiness: '92%', comp: '$220k - $270k', shift: 'Upward (+14% demand)' },
    { role: 'Distributed Infrastructure Lead', company: 'Stripe', match: '91%', window: '1-2 months', readiness: '89%', comp: '$195k - $240k', shift: 'Stable' },
    { role: 'Staff Systems Engineer', company: 'Linear', match: '88%', window: 'Immediate', readiness: '85%', comp: '$180k - $210k', shift: 'Slight Downward' }
  ];

  // Resolve active states
  const hasRealData = !!apiState && apiState.milestones.length > 0;
  const isSimulation = simulationActive;

  const targetRole = isSimulation
    ? 'Principal AI Platform Architect'
    : hasRealData
    ? apiState.target_role
    : 'Distributed Infrastructure & AI Systems Architect';

  const activeVersion = isSimulation ? 3 : hasRealData ? apiState.version : 1;

  const activeMilestones: RoadmapNode[] = isSimulation
    ? simRoadmap.map(m => ({
        skill: m.skill,
        priority: m.priority,
        effort_weeks: m.effortWeeks,
        impact_estimate: m.impactEstimate,
        reason: m.reason,
        status: m.status,
        dependency: m.priority === 'high' ? 'None' : 'Core System Library',
        recommended_sprint: `Sprint: Implement custom ${m.skill.split(' ')[0]} handlers`
      }))
    : hasRealData
    ? apiState.milestones
    : fallbackMilestones;

  // Derive dynamic stats
  const completedCount = activeMilestones.filter(m => m.status === 'completed').length;
  const totalCount = activeMilestones.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const marketAlignment = isSimulation ? `${Math.round(metrics.marketFit)}%` : hasRealData ? '84.2%' : '72.4%';
  const confidenceTrend = isSimulation ? `+${(metrics.matchScore - 92.5).toFixed(1)}% this week` : hasRealData ? '+0.6% target vector shift' : 'Calibrating (Dormant)';
  const activeSpecialization = isSimulation ? 'Distributed Systems & AI Platforms' : hasRealData ? 'Enterprise Infrastructure Engine' : 'AI Systems Infrastructure (Standby)';

  // Gaps
  const activeGaps: GapItem[] = isSimulation
    ? simRoadmap.filter(m => m.status !== 'completed').map((m, idx) => ({
        skill: m.skill,
        demand: m.priority === 'high' ? '94% (High)' : m.priority === 'medium' ? '82% (Medium)' : '68% (Low)',
        priority: idx + 1,
        urgency: m.priority === 'high' ? 'Immediate' : m.priority === 'medium' ? 'High' : 'Medium',
        weight: `${Math.round(m.impactEstimate / 3)}%`
      }))
    : fallbackGaps;

  // Opportunity Alignments
  const activeAlignments: AlignmentItem[] = isSimulation
    ? simOpportunities.map(opp => ({
        role: opp.title,
        company: opp.company,
        match: `${Math.round(opp.alignmentScore * 100)}%`,
        window: opp.urgency === 'high' ? 'Immediate' : '1-2 months',
        readiness: `${Math.round(opp.confidence * 100)}%`,
        comp: opp.urgency === 'high' ? '$210k - $250k' : '$180k - $210k',
        shift: opp.urgency === 'high' ? 'Upward' : 'Stable'
      }))
    : fallbackAlignments;

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <SectionHeader
        title="Adaptive Roadmap"
        subtitle={isSimulation ? `${targetRole} • v${activeVersion} (Simulation Sandbox)` : `${targetRole} • v${activeVersion}`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={triggerSystemScan}
              disabled={systemStatus === 'syncing'}
              className="rounded-lg px-3 py-1.5 text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 font-bold border border-accent/20"
            >
              <Zap size={11} className={systemStatus === 'syncing' ? 'animate-spin' : ''} />
              {systemStatus === 'syncing' ? 'Recalculating Vectors...' : '↻ Recalibrate Roadmap'}
            </button>
          </div>
        }
      />

      {/* DORMANT WARNING NOTIFICATION */}
      {!hasRealData && !isSimulation && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Info size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Dormant Baseline State Loaded</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Milestone engine awaiting portfolio calibration. Upload resume portfolio artifacts on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</a>{' '}
              view or toggle Simulation Mode in the sidebar footer to initialize adaptive trajectory synthesis.
            </p>
          </div>
        </div>
      )}

      {/* TOP STRATEGIC HEADER */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Trajectory Completion</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-white font-mono">{completionPercent}%</span>
            <span className="text-[10px] text-white/20">milestones</span>
          </div>
          <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
          </div>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Active Specialization</span>
          <span className="text-xs font-bold text-white mt-1.5 block truncate capitalize">{activeSpecialization}</span>
          <span className="text-[9px] text-white/20 mt-1 block">Vector focus locked</span>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Target Role</span>
          <span className="text-xs font-bold text-white mt-1.5 block truncate">{targetRole}</span>
          <span className="text-[9px] text-white/20 mt-1 block">Based on profile signals</span>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Market Alignment</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xl font-bold text-accent font-mono">{marketAlignment}</span>
            <ArrowUpRight size={14} className="text-accent" />
          </div>
          <span className="text-[9px] text-white/20 mt-0.5 block">Relative competency index</span>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Confidence Trend</span>
          <span className="text-xs font-bold text-white mt-1.5 block truncate">{confidenceTrend}</span>
          <span className="text-[9px] text-white/20 mt-1 block">Vector drift tracking</span>
        </Panel>
      </div>

      {/* 3-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: ACTIVE ROADMAP (LEFT) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Active Roadmap</h3>
            <span className="text-[9px] font-mono text-white/30">{activeMilestones.length} milestones mapped</span>
          </div>

          <div className="space-y-3">
            {activeMilestones.map((node) => {
              const isCompleted = node.status === 'completed';
              const isDeferred = node.status === 'deferred';

              return (
                <Panel
                  key={node.skill}
                  className={`p-3.5 border transition-all duration-300 relative ${
                    isCompleted
                      ? 'border-emerald-500/10 bg-emerald-500/[0.01] opacity-60'
                      : isDeferred
                      ? 'border-amber-500/10 bg-amber-500/[0.01] opacity-50'
                      : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/[0.08]'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${
                    isCompleted ? 'bg-emerald-500' : isDeferred ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                  <div className="flex items-start gap-2.5">
                    {/* Circle checkbox */}
                    {isCompleted ? (
                      <div className="h-4 w-4 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-success/30">
                        <span className="text-[9px] text-success font-bold">✓</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => markComplete(node.skill)}
                        disabled={isDeferred}
                        className="h-4 w-4 rounded-full border border-white/20 hover:border-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all bg-black/40 hover:bg-blue-500/10 disabled:opacity-50"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold text-white/90 truncate block ${isCompleted ? 'line-through text-white/35' : ''}`}>
                          {node.skill}
                        </span>
                        <StatusBadge status={node.priority === 'high' ? 'error' : node.priority === 'medium' ? 'warning' : 'info'}>
                          {node.priority}
                        </StatusBadge>
                      </div>

                      <p className="text-[10px] text-white/40 leading-relaxed mt-1.5 line-clamp-2">
                        {node.reason}
                      </p>

                      <div className="flex items-center justify-between mt-3 text-[9px] font-mono text-white/25 border-t border-white/[0.02] pt-2">
                        <span>Timeline: <strong className="text-white/40">{node.effort_weeks}w</strong></span>
                        <span className="truncate max-w-[120px]">Requires: <strong className="text-white/40">{node.dependency || 'None'}</strong></span>
                      </div>

                      {node.recommended_sprint && !isCompleted && !isDeferred && (
                        <div className="mt-2 bg-white/[0.02] border border-white/[0.04] p-1.5 rounded text-[9px] font-mono text-blue-400 truncate">
                          💡 {node.recommended_sprint}
                        </div>
                      )}

                      {/* Actions */}
                      {!isCompleted && !isDeferred && (
                        <div className="flex gap-1.5 mt-3 justify-end pt-1 border-t border-white/[0.02]">
                          <button
                            onClick={() => markComplete(node.skill)}
                            className="rounded px-2 py-0.5 text-[10px] border border-success/20 text-success hover:bg-success/15 bg-success/[0.04] transition-all font-bold"
                          >
                            Mark Achieved
                          </button>
                          <button
                            onClick={() => markDeferred(node.skill)}
                            className="rounded px-2 py-0.5 text-[10px] border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all"
                          >
                            Skip Vector
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: GAP ANALYSIS (CENTER) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Gap Analysis</h3>
            <span className="text-[9px] font-mono text-white/30">Target role discrepancies</span>
          </div>

          <Panel className="p-4 border-white/[0.04] bg-[#070b13] space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Telemetry Diagnostic</span>
              <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                Below are missing competencies holding back candidate relevance scores for <strong className="text-white">{targetRole}</strong>.
              </p>
            </div>

            {/* Gap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/35 text-[9px] uppercase tracking-wider">
                    <th className="py-2 font-bold">Skill Deficit</th>
                    <th className="py-2 font-bold text-center">Recruiter Demand</th>
                    <th className="py-2 font-bold text-right">Impact Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {activeGaps.map((gap, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-2.5 font-medium text-white/70">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-red-400" />
                          <span>{gap.skill}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-white/50">{gap.demand}</td>
                      <td className="py-2.5 text-right text-accent font-bold">{gap.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Strategic Warnings */}
            <div className="border-t border-white/[0.04] pt-4 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Strategic Warnings</span>
              {activeGaps.length > 0 ? (
                <div className="p-2.5 rounded border border-warning/10 bg-warning/[0.02] flex items-start gap-2 text-[10px] text-warning font-sans">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Match Rate Degradation:</span> Missing {activeGaps[0]?.skill} reduces recruiter confidence index by up to {activeGaps[0]?.weight}.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded border border-success/10 bg-success/[0.02] flex items-start gap-2 text-[10px] text-success font-sans">
                  <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Relevance Calibrated:</span> No critical skill gaps detected. Trajectory aligns fully with market demand templates.
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* COLUMN 3: OPPORTUNITY ALIGNMENT (RIGHT) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Opportunity Alignment</h3>
            <span className="text-[9px] font-mono text-white/30">Target pipeline matching</span>
          </div>

          <div className="space-y-3">
            {/* Trajectory narrative summary */}
            <Panel className="p-3.5 border-white/[0.04] bg-[#070b13] space-y-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Trajectory Narrative</span>
              <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                {isSimulation
                  ? 'System is simulating CUDA Optimization benchmarks. Trajectory vectors indicate robust alignment for High-Performance Infrastructure roles at scale.'
                  : hasRealData
                  ? 'Active resume indicators show healthy competency clustering. Continue completing milestones to unlock Vercel and Stripe recruiter pipelines.'
                  : 'System standing by in dormant operational mode. Roadmap synthesis is locked onto baseline Infrastructure Architect vectors. Ingest resume portfolio artifacts to calibrate custom skill vectors and sync opportunity matches in real time.'}
              </p>
            </Panel>

            {/* Alignments */}
            {activeAlignments.map((a, idx) => (
              <Panel key={idx} className="p-3.5 border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-semibold text-white/80">{a.role}</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">@ {a.company}</span>
                  </div>
                  <span className="text-xs text-accent font-bold font-mono">{a.match} match</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-white/35 mt-3 border-t border-white/[0.02] pt-2">
                  <div>Readiness: <strong className="text-white/50">{a.readiness}</strong></div>
                  <div>Hiring Window: <strong className="text-white/50">{a.window}</strong></div>
                  <div>Compensation: <strong className="text-white/50">{a.comp}</strong></div>
                  <div>Demand Shift: <strong className="text-emerald-400/80">{a.shift}</strong></div>
                </div>
              </Panel>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
