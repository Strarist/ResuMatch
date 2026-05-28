'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { HardenedRoadmapNode } from '@/data/baseline-profiles';
import { Zap, CheckCircle2, AlertTriangle, ArrowUpRight, Info, Clock, GitBranch } from 'lucide-react';

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
    activePersona,
    lifecycleStage,
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
    { skill: 'GraphQL Federation', demand: '92% (High)', priority: 1, urgency: 'Immediate', weight: '30%' },
    { skill: 'Distributed Caching (Redis)', demand: '88% (High)', priority: 2, urgency: 'High', weight: '25%' },
    { skill: 'CI/CD Performance Tuning', demand: '80% (Medium)', priority: 3, urgency: 'Medium', weight: '15%' }
  ];

  const fallbackAlignments: AlignmentItem[] = [
    { role: 'Staff Full Stack Developer', company: 'Vercel', match: '94%', window: '4 days', readiness: '91%', comp: '$190k - $240k', shift: 'Upward (+12% demand)' },
    { role: 'Senior Frontend Architect', company: 'Linear', match: '90%', window: '12 days', readiness: '88%', comp: '$180k - $220k', shift: 'Stable' }
  ];

  // Resolve active states
  const hasRealData = !!apiState && apiState.milestones.length > 0;
  const isSimulation = simulationActive;

  const targetRole = isSimulation
    ? activePersona.targetRole
    : hasRealData
    ? apiState.target_role
    : 'Awaiting Calibration';

  const activeVersion = isSimulation ? (lifecycleStage >= 3 ? 3 : 1) : hasRealData ? apiState.version : 1;

  // Normalize milestone nodes to expose hardened fields gracefully
  const activeMilestones = (isSimulation
    ? simRoadmap
    : hasRealData
    ? apiState.milestones
    : fallbackMilestones).map(m => {
      const isSimNode = 'effortWeeks' in m;
      if (isSimNode) {
        const hNode = m as unknown as HardenedRoadmapNode;
        return {
          skill: hNode.skill,
          priority: hNode.priority,
          effortWeeks: hNode.effortWeeks,
          impactEstimate: hNode.impactEstimate,
          reason: hNode.reason,
          status: hNode.status,
          dependencies: hNode.dependencies || [],
          completionConfidence: hNode.completionConfidence || 80,
          projectedImpact: hNode.projectedImpact || 'Stabilizes pipeline runtime state.',
          strategicRationale: hNode.strategicRationale || hNode.reason,
          recommended_sprint: `Sprint: Learn ${hNode.skill.split(' ')[0]} syntax`
        };
      } else {
        const legacyNode = m as unknown as RoadmapNode & { effort_weeks?: number; impact_estimate?: number; dependency?: string; recommended_sprint?: string };
        return {
          skill: legacyNode.skill,
          priority: legacyNode.priority,
          effortWeeks: legacyNode.effort_weeks || 4,
          impactEstimate: legacyNode.impact_estimate || 80,
          reason: legacyNode.reason,
          status: legacyNode.status,
          dependencies: legacyNode.dependency ? [legacyNode.dependency] : [],
          completionConfidence: 80,
          projectedImpact: 'Stabilizes pipeline runtime state and boosts competitiveness.',
          strategicRationale: legacyNode.reason,
          recommended_sprint: legacyNode.recommended_sprint || `Sprint: Learn ${legacyNode.skill.split(' ')[0]} syntax`
        };
      }
    });

  // Derive dynamic stats
  const completedCount = activeMilestones.filter(m => m.status === 'completed').length;
  const totalCount = activeMilestones.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const marketAlignment = isSimulation ? `${Math.round(metrics.marketFit)}%` : hasRealData ? '84.2%' : '30%';
  const confidenceTrend = isSimulation ? `+${(metrics.matchScore - 92.5).toFixed(1)}% this week` : hasRealData ? '+0.6% target vector shift' : 'Calibrating (Dormant)';
  const activeSpecialization = isSimulation ? activePersona.specialization : hasRealData ? 'Enterprise Infrastructure Engine' : 'Awaiting Portfolio Ingestion';

  // Gaps
  const activeGaps: GapItem[] = isSimulation
    ? activeMilestones.filter(m => m.status !== 'completed').map((m, idx) => ({
        skill: m.skill,
        demand: m.priority === 'high' ? '94% (High)' : m.priority === 'medium' ? '82% (Medium)' : '68% (Low)',
        priority: idx + 1,
        urgency: m.priority === 'high' ? 'Immediate' : m.priority === 'medium' ? 'High' : 'Medium',
        weight: `${Math.round(m.impactEstimate / 3)}%`
      }))
    : fallbackGaps;

  // Opportunity Alignments
  const activeAlignments: AlignmentItem[] = isSimulation
    ? activePersona.opportunities.map(opp => ({
        role: opp.title,
        company: opp.company,
        match: `${Math.round(opp.alignmentScore * 100)}%`,
        window: opp.hiringWindow || 'Immediate',
        readiness: `${Math.round(opp.confidence * 100)}%`,
        comp: opp.compensation || '$190k+',
        shift: opp.recruiterPressure === 'high' ? 'Upward' : 'Stable'
      }))
    : fallbackAlignments;

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <SectionHeader
        title="Trajectory Roadmap"
        subtitle={isSimulation ? `${targetRole} • v${activeVersion} (Simulation Sandbox)` : `${targetRole} • v${activeVersion}`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={triggerSystemScan}
              disabled={systemStatus === 'syncing' || lifecycleStage === 1}
              className="rounded-lg px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 font-bold border border-emerald-500/20"
            >
              <Zap size={11} className={systemStatus === 'syncing' ? 'animate-spin' : ''} />
              {systemStatus === 'syncing' ? 'Recalculating Vectors...' : '↻ Recalibrate Roadmap'}
            </button>
          </div>
        }
      />

      {/* DORMANT WARNING NOTIFICATION */}
      {lifecycleStage === 1 && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Info size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Dormant Baseline State Loaded</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Roadmap synthesis is locked onto baseline developer vectors. Ingest resume portfolio artifacts on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</a>{' '}
              view or select a baseline persona in the sidebar to initialize your custom career trajectory.
            </p>
          </div>
        </div>
      )}

      {/* TOP STRATEGIC HEADER */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Roadmap Completion</span>
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
            <span className="text-xl font-bold text-emerald-400 font-mono">{marketAlignment}</span>
            <ArrowUpRight size={14} className="text-emerald-400" />
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
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Execution Roadmap</h3>
            <span className="text-[9px] font-mono text-white/30">{activeMilestones.length} milestones mapped</span>
          </div>

          <div className="space-y-3">
            {activeMilestones.map((node) => {
              const isCompleted = node.status === 'completed';
              const isDeferred = node.status === 'deferred';

              return (
                <Panel
                  key={node.skill}
                  className={`p-4 border transition-all duration-300 relative ${
                    isCompleted
                      ? 'border-emerald-500/10 bg-emerald-500/[0.01] opacity-60'
                      : isDeferred
                      ? 'border-amber-500/10 bg-amber-500/[0.01] opacity-50'
                      : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/[0.08]'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${
                    isCompleted ? 'bg-emerald-500' : isDeferred ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                  <div className="flex items-start gap-3">
                    {/* Circle checkbox */}
                    {isCompleted ? (
                      <div className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                        <span className="text-[9px] text-emerald-400 font-bold">✓</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => markComplete(node.skill)}
                        disabled={isDeferred || lifecycleStage === 1}
                        className="h-4.5 w-4.5 rounded-full border border-white/20 hover:border-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all bg-black/40 hover:bg-emerald-500/10 disabled:opacity-30"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold text-white/95 truncate block ${isCompleted ? 'line-through text-white/35' : ''}`}>
                          {node.skill}
                        </span>
                        <StatusBadge status={node.priority === 'high' ? 'error' : node.priority === 'medium' ? 'warning' : 'info'}>
                          {node.priority}
                        </StatusBadge>
                      </div>

                      {/* Hardened dependencies list */}
                      {node.dependencies.length > 0 && (
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono mt-1">
                          <GitBranch size={9} />
                          <span>Requires: {node.dependencies.join(', ')}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                        {node.strategicRationale || node.reason}
                      </p>

                      {/* Confidence and Impact descriptors */}
                      {!isCompleted && !isDeferred && (
                        <div className="mt-3 bg-white/[0.01] border border-white/[0.03] p-2 rounded text-[10px] space-y-1">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Projected Impact:</span>
                            <span className="text-white font-medium">{node.projectedImpact}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Synthesis Confidence:</span>
                            <span className="text-emerald-400 font-bold">{node.completionConfidence}%</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 text-[9px] font-mono text-white/25 border-t border-white/[0.02] pt-2">
                        <span className="flex items-center gap-1"><Clock size={10} /> Duration: {node.effortWeeks}w</span>
                        <span>Estimated Value: +{node.impactEstimate} ROI</span>
                      </div>

                      {/* Actions */}
                      {!isCompleted && !isDeferred && lifecycleStage > 1 && (
                        <div className="flex gap-1.5 mt-3 justify-end pt-1.5 border-t border-white/[0.02]">
                          <button
                            onClick={() => markComplete(node.skill)}
                            className="rounded px-2.5 py-1 text-[10px] border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 bg-emerald-500/[0.04] transition-all font-bold"
                          >
                            Mark Achieved
                          </button>
                          <button
                            onClick={() => markDeferred(node.skill)}
                            className="rounded px-2.5 py-1 text-[10px] border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all"
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

        {/* COLUMN 2: SKILL GAP TELEMETRY (CENTER) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Recruiter Gaps</h3>
            <span className="text-[9px] font-mono text-white/30">Priority shortages</span>
          </div>

          <Panel className="p-4 border-white/[0.04] bg-[#070b13] space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Telemetry Diagnostic</span>
              <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                These missing skills are currently flagged as high risks by screening filters.
              </p>
            </div>

            {/* Gap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/35 text-[9px] uppercase tracking-wider">
                    <th className="py-2 font-bold">Deficit</th>
                    <th className="py-2 font-bold text-center">Urgency</th>
                    <th className="py-2 font-bold text-right">Risk %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {activeGaps.map((gap, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-2.5 font-medium text-white/70">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          <span>{gap.skill}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-white/50">{gap.urgency}</td>
                      <td className="py-2.5 text-right text-amber-400 font-bold">{gap.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Strategic Warnings */}
            <div className="border-t border-white/[0.04] pt-4 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Strategic Warnings</span>
              {activeGaps.length > 0 ? (
                <div className="p-2.5 rounded border border-red-500/10 bg-red-500/[0.02] flex items-start gap-2 text-[10px] text-red-400 font-sans">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-semibold">Relevance Alert:</span> Recruiter filtering expects {activeGaps[0]?.skill} validation. Incomplete gaps limit interview callback conversion.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded border border-emerald-500/10 bg-emerald-500/[0.02] flex items-start gap-2 text-[10px] text-emerald-400 font-sans">
                  <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold">All Gaps Bridged:</span> You have validated all core specializations required for the target trajectory.
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* COLUMN 3: OPPORTUNITY MATCHES (RIGHT) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Opportunities Map</h3>
            <span className="text-[9px] font-mono text-white/30">Target pipeline matching</span>
          </div>

          <div className="space-y-3">
            {/* Trajectory narrative summary */}
            <Panel className="p-3.5 border-white/[0.04] bg-[#070b13] space-y-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Strategic Trajectory</span>
              <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                {isSimulation
                  ? `Your active trajectory matches ${activePersona.specialization}. Bridge outstanding gap milestones to trigger priority screening channels at your target companies.`
                  : 'System standing by in dormant operational mode. Roadmap synthesis is locked onto baseline developer vectors.'}
              </p>
            </Panel>

            {/* Alignments */}
            {activeAlignments.map((a, idx) => (
              <Panel key={idx} className="p-3.5 border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-semibold text-white/90">{a.role}</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">@ {a.company}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold font-mono">{a.match} match</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-white/35 mt-3 border-t border-white/[0.02] pt-2">
                  <div>Readiness: <strong className="text-white/50">{a.readiness}</strong></div>
                  <div>Window: <strong className="text-white/50">{a.window}</strong></div>
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
