'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from '@/lib/env';
import {
  PageContainer,
  GlassPanel,
  SectionLabel,
  WorkspaceCard,
  LoadingPulse,
  EmptyState
} from '@/components/workspace';
import {
  GitMerge,
  Cpu,
  RefreshCw,
  Sliders,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

interface OrchestrationState {
  redundant_paths_identified: string[];
  simplified_propagation_chains: string[];
  optimized_queue_depth: number;
  topology_depth_before: number;
  topology_depth_after: number;
  simplification_percentage: number;
}

interface ReplayState {
  replay_determinism_index: number;
  catchup_alignment_cycles: number;
  delta_compression_ratio: number;
  transport_packet_compaction_rate: number;
  aligned_snapshots_count: number;
  is_alignment_coherent: boolean;
}

interface TelemetryState {
  original_signals_count: number;
  compacted_signals_count: number;
  telemetry_savings_percentage: number;
  signal_priority: string;
  operational_importance: number;
  replay_relevance: number;
  trust_impact: number;
  compression_reason: string;
}

interface ReliabilityState {
  calibrated_trust_score: number;
  resilience_retry_cooldown_seconds: number;
  adjusted_degradation_latency_ms: number;
  adjusted_degradation_memory_mb: number;
  calibration_applied: boolean;
  calibration_pacing_cooldown_active: boolean;
}

interface PruningState {
  dead_abstractions: string[];
  overlapping_services: string[];
  obsolete_helpers: string[];
  estimated_loc_saved: number;
  pruning_safety_score: number;
}

interface CoherenceTimelineStep {
  timestamp: number;
  event: string;
  component: string;
  status: string;
  message: string;
}

interface ConvergenceResponse {
  coherence_index: number;
  orchestration_state: OrchestrationState;
  replay_state: ReplayState;
  telemetry_state: TelemetryState;
  reliability_state: ReliabilityState;
  pruning_recommendations: PruningState;
  coherence_timeline: CoherenceTimelineStep[];
  is_optimized: boolean;
  is_calibrated: boolean;
}

export default function ConvergencePage() {
  const [data, setData] = useState<ConvergenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchConvergenceData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/convergence/status`, { headers });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Error fetching convergence status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerOptimize = async () => {
    setActing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/convergence/optimize`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchConvergenceData();
      }
    } catch (err) {
      console.error("Error executing optimization loop:", err);
    } finally {
      setActing(false);
    }
  };

  const triggerCalibrate = async () => {
    setActing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/convergence/calibrate`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchConvergenceData();
      }
    } catch (err) {
      console.error("Error executing calibration loop:", err);
    } finally {
      setActing(false);
    }
  };

  const triggerReset = async () => {
    setActing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/convergence/reset`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchConvergenceData();
      }
    } catch (err) {
      console.error("Error resetting state:", err);
    } finally {
      setActing(false);
    }
  };

  useEffect(() => {
    fetchConvergenceData();
  }, [fetchConvergenceData]);

  if (loading) {
    return (
      <PageContainer title="Structural Convergence" subtitle="Operational Coherence Tuning & Pruning Console">
        <LoadingPulse rows={8} />
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer title="Structural Convergence" subtitle="Operational Coherence Tuning & Pruning Console">
        <EmptyState
          icon={GitMerge}
          title="Convergence Telemetry Offline"
          description="Initiate an active rebalancing sequence to verify structure alignment indicators."
        />
      </PageContainer>
    );
  }

  const {
    coherence_index,
    orchestration_state,
    replay_state,
    telemetry_state,
    reliability_state,
    pruning_recommendations,
    coherence_timeline,
    is_optimized,
    is_calibrated
  } = data;

  return (
    <PageContainer
      title="Convergence Hardening"
      subtitle="Simplifying Orchestration Loops, Deduplicating Telemetry Traces & Calibrating Reliability"
    >
      {/* Dynamic Overall Coherence Index Panel */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        
        {/* Dynamic overall coherence dial */}
        <GlassPanel className="flex flex-col items-center justify-center p-6 border-indigo-500/10">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/30 mb-4">Operational Coherence Index</h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" className="stroke-white/[0.02] stroke-[8] fill-none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-indigo-500 stroke-[8] fill-none transition-all duration-1000"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * coherence_index)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {Math.round(coherence_index * 100)}%
              </span>
              <span className="text-[8px] font-mono text-indigo-400 mt-1 uppercase tracking-widest font-bold">
                COHERENT
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Coherence components progress indices */}
        <WorkspaceCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Structural Coherence Vectors</SectionLabel>
              <span className="text-[10px] text-white/30 font-mono">Consolidated system indicators</span>
            </div>
            
            <div className="space-y-3.5">
              {[
                { label: 'Orchestration Simplification', score: orchestration_state.simplification_percentage, color: 'bg-emerald-400 border-emerald-400/20' },
                { label: 'Replay Alignment Coherence', score: replay_state.replay_determinism_index, color: 'bg-cyan-400 border-cyan-400/20' },
                { label: 'Telemetry Savings Ratio', score: telemetry_state.telemetry_savings_percentage, color: 'bg-indigo-400 border-indigo-400/20' },
                { label: 'Reliability Scoring Calibration', score: reliability_state.calibrated_trust_score, color: 'bg-amber-400 border-amber-400/20' },
                { label: 'Pruning Safety Quotient', score: pruning_recommendations.pruning_safety_score, color: 'bg-slate-400 border-slate-400/20' }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-xs mb-1 font-mono">
                    <span className="text-white/50">{item.label}</span>
                    <span className="font-bold text-white/80">{Math.round(item.score * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </WorkspaceCard>

      </div>

      {/* Control Banner & Refinement Loop Simulator */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        
        {/* Trigger structural optimizations */}
        <div className="flex flex-col justify-between p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <Cpu size={13} className="text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/85">Compact Loops & Paths</h2>
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              Consolidate event channels, optimize propagation queue bounds, and compress stale trajectory top-DAG node trees.
            </p>
          </div>

          <button
            onClick={triggerOptimize}
            disabled={acting || is_optimized}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/20 text-xs font-semibold bg-emerald-500/[0.06] text-emerald-300 hover:bg-emerald-500/[0.12] disabled:opacity-50 transition-all mt-4 self-start"
          >
            <Sparkles size={10} />
            {is_optimized ? "System Compacted" : "Execute Loop Compaction"}
          </button>
        </div>

        {/* Trigger Calibration */}
        <div className="flex flex-col justify-between p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <Sliders size={13} className="text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/85">Calibrate Reliability</h2>
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              Recalibrate connection retry cooldown pacers and graceful degradation thresholds to prevent telemetry jittering loops.
            </p>
          </div>

          <button
            onClick={triggerCalibrate}
            disabled={acting || is_calibrated}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/20 text-xs font-semibold bg-cyan-500/[0.06] text-cyan-300 hover:bg-cyan-500/[0.12] disabled:opacity-50 transition-all mt-4 self-start"
          >
            <RefreshCw size={10} className={acting ? 'animate-spin' : ''} />
            {is_calibrated ? "Reliability Tuned" : "Tune Reliability Scoring"}
          </button>
        </div>

        {/* Reset State parameters */}
        <div className="flex flex-col justify-between p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <Database size={13} className="text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/85">Baseline Calibration</h2>
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              Restore default baseline values and parameters across structural channels to inspect full transition sequences.
            </p>
          </div>

          <button
            onClick={triggerReset}
            disabled={acting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-semibold bg-white/[0.02] text-white/70 hover:bg-white/[0.06] disabled:opacity-50 transition-all mt-4 self-start"
          >
            <Maximize2 size={10} />
            Reset Convergence State
          </button>
        </div>

      </div>

      {/* Main Console details grid layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Simplification & Telemetry Compression */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Simplification panel */}
          <GlassPanel className={is_optimized ? "border-emerald-500/20" : ""}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-emerald-400" />
                <SectionLabel>Orchestration Loop Simplification</SectionLabel>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                COMPACTED: {formatPercentage(orchestration_state.simplification_percentage)}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Redundant propagation channels */}
                <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Compacted Event Channels</h5>
                  <div className="space-y-1.5">
                    {orchestration_state.simplified_propagation_chains.map((chain) => (
                      <div key={chain} className="text-xs font-mono font-semibold text-emerald-300 px-2 py-1 rounded bg-emerald-500/[0.04] border border-emerald-500/10">
                        {chain}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stale paths identified */}
                <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Redundant Paths Pruned</h5>
                  {orchestration_state.redundant_paths_identified.length > 0 ? (
                    <div className="space-y-1.5">
                      {orchestration_state.redundant_paths_identified.map((path) => (
                        <div key={path} className="text-xs font-mono font-semibold text-rose-300 px-2 py-1 rounded bg-rose-500/[0.04] border border-rose-500/10 line-through">
                          {path}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/20 italic p-1">No duplicate channels identified.</div>
                  )}
                </div>

              </div>

              {/* Top depths indicator before/after */}
              <div className="grid md:grid-cols-3 gap-4 border-t border-white/[0.04] pt-4 text-xs font-mono text-white/50">
                <div className="flex justify-between border-r border-white/[0.04] pr-4">
                  <span>Optimized Event Queue Bounds</span>
                  <span className="font-bold text-white">{orchestration_state.optimized_queue_depth} depth</span>
                </div>
                <div className="flex justify-between border-r border-white/[0.04] px-4">
                  <span>Topology Hierarchy Depth</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40">{orchestration_state.topology_depth_before}</span>
                    <ArrowRight size={10} className="text-white/30" />
                    <span className="font-bold text-emerald-300">{orchestration_state.topology_depth_after}</span>
                  </div>
                </div>
                <div className="flex justify-between pl-4">
                  <span>Replay Alignment Quality</span>
                  <span className="font-bold text-white">{Math.round(replay_state.replay_determinism_index * 100)}%</span>
                </div>
              </div>

            </div>
          </GlassPanel>

          {/* Telemetry Compression Explorer */}
          <GlassPanel className={is_optimized ? "border-indigo-500/20" : ""}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-indigo-400" />
                <SectionLabel>Telemetry Compression Explorer</SectionLabel>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">
                REDUCED: {formatPercentage(telemetry_state.telemetry_savings_percentage)}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-white/50 font-sans leading-relaxed">{telemetry_state.compression_reason}</p>

              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Reduction metrics stats */}
                <div className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Logging Overhead Compacted</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-indigo-300">{telemetry_state.compacted_signals_count}</span>
                    <span className="text-xs text-white/40">signals from {telemetry_state.original_signals_count}</span>
                  </div>
                  <div className="text-[10px] text-white/40 mt-1.5">
                    Preserved dynamic observation metrics indicators while saving telemetry throughput loops.
                  </div>
                </div>

                {/* Narrative Token stats */}
                <div className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Context Window Tokens compacted</span>
                    <div className="text-xs font-bold text-white mt-1">AI Cognitive compaction</div>
                  </div>
                  <div className="text-[10px] text-white/40 border-t border-white/[0.04] pt-1.5 mt-1.5 flex justify-between font-mono">
                    <span>Compaction Ratio</span>
                    <span className="text-emerald-400">{Math.round(replay_state.transport_packet_compaction_rate * 100)}% scale</span>
                  </div>
                </div>

              </div>

              {/* Progress dimensions */}
              <div className="grid md:grid-cols-3 gap-4 text-xs font-mono text-white/50 pt-2 border-t border-white/[0.04]">
                <div className="flex justify-between">
                  <span>Priority rating</span>
                  <span className="font-bold text-white">{telemetry_state.signal_priority}</span>
                </div>
                <div className="flex justify-between">
                  <span>Relevance</span>
                  <span className="font-bold text-white">{Math.round(telemetry_state.replay_relevance * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Scoring Impact</span>
                  <span className="font-bold text-white">{Math.round(telemetry_state.trust_impact * 100)}%</span>
                </div>
              </div>

            </div>
          </GlassPanel>

        </div>

        {/* Right Column: Reliability Calibration & Timelines */}
        <div className="space-y-6">
          
          {/* Reliability Calibration Dashboard */}
          <WorkspaceCard className={is_calibrated ? "border-amber-500/20" : ""}>
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-amber-400" />
              <SectionLabel>Reliability & Safety Tuning</SectionLabel>
            </div>
            
            <div className="space-y-4 mt-4 text-xs font-mono text-white/50">
              
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Calibrated Trust Score</span>
                  <span className="text-sm font-bold text-amber-300 mt-1 block">
                    {Math.round(reliability_state.calibrated_trust_score * 100)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Retry Cooldown pacing</span>
                  <span className="text-xs font-bold text-white/70 mt-1 block">
                    {reliability_state.resilience_retry_cooldown_seconds}s
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/[0.04] pt-3">
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span>Degradation Latency tolerance</span>
                  <span className="font-bold text-white">{reliability_state.adjusted_degradation_latency_ms}ms</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span>Degradation Memory tolerance</span>
                  <span className="font-bold text-white">{reliability_state.adjusted_degradation_memory_mb}MB</span>
                </div>
              </div>

            </div>
          </WorkspaceCard>

          {/* Abstraction Pruning panel */}
          <WorkspaceCard>
            <div className="flex items-center gap-2">
              <Info size={14} className="text-slate-400" />
              <SectionLabel>Architecture Pruning Recommendation</SectionLabel>
            </div>

            <div className="space-y-3.5 mt-4">
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider">Estimated Refinement savings</span>
                  <span className="text-xs font-mono font-bold text-white">{pruning_recommendations.estimated_loc_saved} LOC</span>
                </div>
                <div className="text-[10px] text-white/40 leading-normal">
                  Reduces code lines count by removing duplicate helpers and stale state structures.
                </div>
              </div>

              <div>
                <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-1.5">Identified Stale Helpers</h5>
                <div className="flex flex-wrap gap-1.5">
                  {pruning_recommendations.obsolete_helpers.map((help) => (
                    <span key={help} className="text-[9px] px-2 py-0.5 rounded bg-slate-500/[0.06] border border-slate-500/20 text-slate-400 font-medium">
                      {help}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </WorkspaceCard>

          {/* Operational Coherence Timeline */}
          <WorkspaceCard>
            <SectionLabel>Operational Coherence Timeline</SectionLabel>
            
            <div className="relative pl-5 border-l border-white/[0.06] ml-2 mt-4 space-y-5">
              {coherence_timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[28px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 border ${
                    step.status === 'SUCCESS' ? 'border-emerald-500 bg-emerald-500/20' :
                    step.status === 'WARNING' ? 'border-amber-500 bg-amber-500/20' :
                    'border-slate-500 bg-slate-500/20'
                  }`} />
                  
                  <div className="text-[10px] font-mono text-white/20 mb-0.5">
                    {new Date(step.timestamp * 1000).toLocaleTimeString()}
                  </div>
                  <h4 className="text-xs font-bold text-white/85 mb-0.5">{step.event}</h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-sans">{step.message}</p>
                </div>
              ))}
            </div>
          </WorkspaceCard>

        </div>

      </div>

    </PageContainer>
  );
}

function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}
