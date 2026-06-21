'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader } from '@/components/ds';
import { roadmap } from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { HardenedRoadmapNode } from '@/data/baseline-profiles';
import { Zap, CheckCircle2, AlertTriangle, ArrowUpRight, Info, Clock, Compass } from 'lucide-react';
import { toast } from 'sonner';

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
  const [apiState, setApiState] = useState<{ target_role: string; version: number; milestones: RoadmapNode[]; last_generated_at?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const formatTimestamp = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    const d = new Date(dateString);
    const now = new Date();

    const isToday = d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.getDate() === yesterday.getDate() &&
                        d.getMonth() === yesterday.getMonth() &&
                        d.getFullYear() === yesterday.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    if (isToday) {
      return `Today • ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday • ${timeStr}`;
    } else {
      return `${d.toLocaleDateString()} • ${timeStr}`;
    }
  };

  const {
    simulationActive,
    roadmap: simRoadmap,
    completeRoadmapNode,
    deferRoadmapNode,
    revertRoadmapNode,
    triggerSystemScan,
    systemStatus,
    metrics,
    activePersona,
    lifecycleStage,
    hasStrategicProfile,
  } = useLivingSystem();

  const [recalibrating, setRecalibrating] = useState(false);

  const handleRealRecalibrate = async () => {
    setRecalibrating(true);
    try {
      await roadmap.recalibrate();
      toast.success('Roadmap updated successfully');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Recalibration failed.');
    } finally {
      setRecalibrating(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const d = await roadmap.getState();
      if (d.state) {
        setApiState({
          target_role: d.state.target_role,
          version: d.state.version,
          last_generated_at: (d.state as { last_generated_at?: string | null }).last_generated_at,
          milestones: d.state.snapshot?.milestones?.map((m) => ({
            skill: m.skill,
            priority: (m.priority as RoadmapNode['priority']) || 'medium',
            effort_weeks: m.effort_weeks || 4,
            impact_estimate: (m as { impact_estimate?: number }).impact_estimate || 80,
            reason: m.reason || '',
            status: (m.status as RoadmapNode['status']) || 'active',
            dependency: (m as { dependency?: string }).dependency || (m.priority === 'high' ? 'None' : 'Core Language Stack'),
            recommended_sprint: (m as { recommended_sprint?: string }).recommended_sprint || `Sprint: ${m.skill} foundations`,
          })) || [],
        });
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
    await roadmap.completeNode(skill);
    fetchData();
  };

  const markDeferred = async (skill: string) => {
    if (simulationActive || !apiState) {
      deferRoadmapNode(skill);
      return;
    }
    await roadmap.deferNode(skill);
    fetchData();
  };

  const undoComplete = async (skill: string) => {
    if (simulationActive || !apiState) {
      revertRoadmapNode(skill);
      return;
    }
    await roadmap.undoNode(skill);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Career Roadmap"
          subtitle="Loading your adaptive career vectors..."
        />
        <RoadmapSkeleton />
      </div>
    );
  }

  // Resolve active states
  const hasRealData = !!apiState && apiState.milestones.length > 0;
  const isSimulation = simulationActive;

  const targetRole = isSimulation
    ? activePersona.targetRole
    : hasRealData
    ? apiState!.target_role
    : 'Not configured';

  const activeVersion = isSimulation ? (lifecycleStage >= 3 ? 3 : 1) : hasRealData ? apiState!.version : 1;

  const activeMilestones = (isSimulation
    ? simRoadmap
    : hasRealData
    ? apiState!.milestones
    : []).map(m => {
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

  const marketAlignment = isSimulation ? `${Math.round(metrics.marketFit)}%` : hasRealData ? '—' : '—';
  const confidenceTrend = isSimulation ? `+${(metrics.matchScore - 92.5).toFixed(1)}% this week` : hasRealData ? 'Tracking active milestones' : 'Upload resume to begin';
  const activeSpecialization = isSimulation ? activePersona.specialization : hasRealData ? 'From your profile' : 'Not configured';

  const activeGaps: GapItem[] = isSimulation
    ? activeMilestones.filter(m => m.status !== 'completed').map((m, idx) => ({
        skill: m.skill,
        demand: m.priority === 'high' ? '94% (High)' : m.priority === 'medium' ? '82% (Medium)' : '68% (Low)',
        priority: idx + 1,
        urgency: m.priority === 'high' ? 'Immediate' : m.priority === 'medium' ? 'High' : 'Medium',
        weight: `${Math.round(m.impactEstimate / 3)}%`
      }))
    : activeMilestones.filter(m => m.status !== 'completed').map((m, idx) => ({
        skill: m.skill,
        demand: m.priority === 'high' ? 'High' : 'Medium',
        priority: idx + 1,
        urgency: m.priority === 'high' ? 'Immediate' : 'Medium',
        weight: `${Math.round(m.impactEstimate / 3)}%`,
      }));

  const activeAlignments: AlignmentItem[] = isSimulation
    ? activePersona.opportunities.map(opp => ({
        role: opp.title,
        company: opp.company,
        match: `${Math.round(opp.alignmentScore * 100)}%`,
        window: opp.hiringWindow || 'Immediate',
        readiness: `${Math.round(opp.confidence * 100)}%`,
        comp: opp.compensation || '—',
        shift: opp.recruiterPressure === 'high' ? 'Upward' : 'Stable'
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <SectionHeader
        title="Career Roadmap"
        subtitle={isSimulation ? `${targetRole} • v${activeVersion} (Simulation Sandbox)` : `${targetRole} • v${activeVersion}`}
        action={
          <div className="flex items-center gap-4">
            {!isSimulation && apiState?.last_generated_at && (
              <span className="hidden sm:inline text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Last recalibrated: {formatTimestamp(apiState.last_generated_at)}
              </span>
            )}
            <button
              onClick={async () => {
                if (isSimulation) {
                  await triggerSystemScan();
                } else {
                  await handleRealRecalibrate();
                }
              }}
              disabled={systemStatus === 'syncing' || !hasStrategicProfile || recalibrating}
              className="rounded-lg px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50 font-bold border border-emerald-500/20"
            >
              <Zap size={11} className={systemStatus === 'syncing' || recalibrating ? 'animate-spin' : ''} />
              {systemStatus === 'syncing' || recalibrating ? 'Recalculating Career Path...' : '↻ Recalibrate Roadmap'}
            </button>
          </div>
        }
      />

      {/* DORMANT WARNING NOTIFICATION */}
      {!hasStrategicProfile && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Info size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Standby Mode</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Your career roadmap will appear after you upload a resume or configure your profile on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes</a>{' '}
              or{' '}
              <a href="/profile" className="text-blue-400 underline hover:text-blue-300">Profile</a>{' '}
              pages.
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
          <span className="text-[9px] text-white/20 mt-1 block">Upskilling focus locked</span>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Target Role</span>
          <span className="text-xs font-bold text-white mt-1.5 block truncate">{targetRole}</span>
          <span className="text-[9px] text-white/20 mt-1 block">Based on profile qualifications</span>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Market Alignment</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xl font-bold text-emerald-400 font-mono">{marketAlignment}</span>
            <ArrowUpRight size={14} className="text-emerald-400" />
          </div>
          <span className="text-[9px] text-white/20 mt-0.5 block">Relative skills match</span>
        </Panel>

        <Panel className="p-3 border-white/[0.04] bg-white/[0.01]">
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider block">Upskilling Progress</span>
          <span className="text-xs font-bold text-white mt-1.5 block truncate">{confidenceTrend}</span>
          <span className="text-[9px] text-white/20 mt-1 block">Progress tracking</span>
        </Panel>
      </div>

      {/* 3-COLUMN WORKSPACE or ONBOARDING CTA */}
      {!isSimulation && !hasRealData ? (
        <div className="p-8 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-center max-w-2xl mx-auto my-12 space-y-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-400">
            <Compass size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Generate Your Career Roadmap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We need to analyze your current skillset and targets first. Upload your resume or configure your career profile to generate custom milestones, prioritize skill gaps, and map real opportunities.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href="/resumes"
              className="rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 text-black text-xs font-bold transition-colors"
            >
              Upload Resume
            </a>
            <a
              href="/profile"
              className="rounded-lg px-4 py-2 border border-white/10 hover:bg-white/[0.03] text-white text-xs font-bold transition-colors"
            >
              Configure Profile
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: ACTIVE ROADMAP (LEFT) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Skills Roadmap</h3>
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
                        disabled={isDeferred || !hasStrategicProfile}
                        className="h-4.5 w-4.5 rounded-full border border-white/20 hover:border-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all bg-black/40 hover:bg-emerald-500/10 disabled:opacity-30"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold text-white/95 truncate block ${isCompleted ? 'line-through text-white/35' : ''}`}>
                          {node.skill}
                        </span>
                        <div className="flex gap-1.5 flex-shrink-0">
                          {isCompleted && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 font-semibold uppercase">
                              Achieved
                            </span>
                          )}
                          {isDeferred && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border border-slate-500/20 text-slate-400 bg-slate-500/5 font-semibold uppercase">
                              Skipped
                            </span>
                          )}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase ${
                            node.priority === 'high'
                              ? 'border-red-500/20 text-red-400 bg-red-500/5'
                              : node.priority === 'medium'
                              ? 'border-amber-500/20 text-amber-400 bg-amber-500/5'
                              : 'border-blue-500/20 text-blue-400 bg-blue-500/5'
                          } font-semibold font-mono`}>
                            {node.priority} Priority
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed mt-2.5">
                        <span className="font-semibold text-white/50 block text-[9px] uppercase tracking-wider mb-0.5">Why it matters:</span>
                        {node.reason || node.strategicRationale}
                      </p>

                      <div className="flex items-center gap-1.5 mt-3.5 text-[10px] font-mono text-white/40">
                        <Clock size={10} />
                        <span>Estimated Duration: {node.effortWeeks} weeks</span>
                      </div>

                      {/* Actions */}
                      {hasStrategicProfile && (
                        <div className="flex gap-1.5 mt-3 justify-end pt-1.5 border-t border-white/[0.02]">
                          {!isCompleted && !isDeferred ? (
                            <>
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
                                Skip Skill
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => undoComplete(node.skill)}
                              className="rounded px-2.5 py-1 text-[10px] border border-white/10 text-white/60 hover:text-white/95 hover:bg-white/[0.03] transition-all"
                            >
                              Undo {isCompleted ? 'Completion' : 'Skip'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: SKILLS TO IMPROVE (CENTER) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Skills to Improve</h3>
            <span className="text-[9px] font-mono text-white/30">Priority shortages</span>
          </div>

          <Panel className="p-4 border-white/[0.04] bg-[#070b13] space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Skills Assessment</span>
              <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                These missing skills are recommended targets to align your profile for matching opportunities.
              </p>
            </div>

            {/* Gap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/35 text-[9px] uppercase tracking-wider">
                    <th className="py-2 font-bold">Missing Skill</th>
                    <th className="py-2 font-bold text-center">Priority</th>
                    <th className="py-2 font-bold text-right">Impact</th>
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

            {/* Recommendations */}
            <div className="border-t border-white/[0.04] pt-4 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Key Recommendations</span>
              {activeGaps.length > 0 ? (
                <div className="p-2.5 rounded border border-red-500/10 bg-red-500/[0.02] flex items-start gap-2 text-[10px] text-red-400 font-sans">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />
                  <div>
                    <span className="font-semibold">Recommendation:</span> Hiring managers expect {activeGaps[0]?.skill} validation. Bridging this gap improves interview potential.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded border border-emerald-500/10 bg-emerald-500/[0.02] flex items-start gap-2 text-[10px] text-emerald-400 font-sans">
                  <CheckCircle2 size={12} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold">All Gaps Bridged:</span> You have validated all core skills required for your target career path.
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* COLUMN 3: OPPORTUNITY MATCHES (RIGHT) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Matching Opportunities</h3>
            <span className="text-[9px] font-mono text-white/30">Target pipeline matching</span>
          </div>

          <div className="space-y-3">
            {/* Career Insights summary */}
            <Panel className="p-3.5 border-white/[0.04] bg-[#070b13] space-y-2.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Career Path Insights</span>
              <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                {isSimulation
                  ? `Your profile matches the requirements for ${activePersona.specialization}. Bridge outstanding skill gaps to trigger faster application responses at your target companies.`
                  : 'System in standby mode. Ingest resume portfolio artifacts on the Resumes page or select a baseline persona to initialize your custom career path.'}
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
                  <div>Skills Match: <strong className="text-white/50">{a.readiness}</strong></div>
                  <div>Status: <strong className="text-white/50">{a.window}</strong></div>
                  <div>Salary: <strong className="text-white/50">{a.comp}</strong></div>
                  <div>Industry Demand: <strong className="text-emerald-400/80">{a.shift}</strong></div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Header Grid Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] space-y-2 h-20">
            <div className="h-3 w-16 bg-white/10 rounded" />
            <div className="h-6 w-24 bg-white/20 rounded mt-1" />
          </div>
        ))}
      </div>

      {/* 3-Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Skills Roadmap Skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-5 w-32 bg-white/10 rounded mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-white/20 rounded" />
                  <div className="h-3 w-1/3 bg-white/10 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-white/[0.02]">
                <div className="h-3 w-full bg-white/[0.04] rounded" />
                <div className="h-3 w-5/6 bg-white/[0.04] rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Column 2: Skills to Improve Skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <div className="h-5 w-28 bg-white/10 rounded mb-2" />
          <div className="p-4 rounded-xl border border-white/[0.04] bg-[#070b13] space-y-4">
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-16 w-full bg-white/[0.02] rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <div className="h-3.5 w-24 bg-white/25 rounded" />
                  <div className="h-3.5 w-12 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3: Matching Opportunities Skeleton */}
        <div className="lg:col-span-4 space-y-4">
          <div className="h-5 w-36 bg-white/10 rounded mb-2" />
          <div className="p-4 rounded-xl border border-white/[0.04] bg-[#070b13] h-20" />
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.01] bg-white/[0.01] space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/20 rounded" />
                  <div className="h-3 w-20 bg-white/10 rounded" />
                </div>
                <div className="h-4 w-12 bg-emerald-500/20 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.02]">
                <div className="h-3 w-16 bg-white/10 rounded" />
                <div className="h-3 w-20 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
