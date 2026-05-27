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
  Activity,
  RefreshCw,
  Layers,
  AlertTriangle,
  Play,
  Heart
} from 'lucide-react';

interface FailureContainment {
  isolated_subsystems: string[];
  propagation_lockdowns: string[];
  degraded_services: string[];
  recovery_priority: string;
  containment_reason: string;
  runtime_risk_score: number;
}

interface DegradationState {
  active_profile: string;
  expensive_telemetry_disabled: boolean;
  synthesis_density: string;
  prediction_pacing_seconds: number;
  transport_broadcast_rate: number;
  suspended_features?: string[];
  system_stress_ratio?: number;
}

interface RecoveryAction {
  component_name: string;
  action_taken: string;
  reconstruction_successful: boolean;
  restoration_timestamp: number;
}

interface ResilienceVector {
  containment_quality: number;
  recovery_quality: number;
  degradation_stability: number;
  orchestration_resilience: number;
  transport_resilience: number;
  overall_survivability: number;
}

interface RecoveryTimelineStep {
  timestamp: number;
  event: string;
  component: string;
  status: string;
  message: string;
}

export default function ResiliencePage() {
  const [status, setStatus] = useState<{
    containment_state: FailureContainment;
    degradation_state: DegradationState;
    recovery_actions: RecoveryAction[];
    resilience_vector: ResilienceVector;
    recovery_timeline: RecoveryTimelineStep[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [failureType, setFailureType] = useState<'stream_disconnect' | 'prediction_drift' | 'system_overload'>('stream_disconnect');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/resilience/status`, { headers });
      if (res.ok) setStatus(await res.json());
    } catch (e) {
      console.error("Error fetching operational resilience status: ", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerSimulation = async () => {
    setActing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
    
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/resilience/simulate-failure`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ failure_type: failureType })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  const triggerRecovery = async () => {
    setActing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/resilience/recover`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <PageContainer title="System Resilience" subtitle="Self-stabilizing distributed diagnostics">
        <LoadingPulse rows={8} />
      </PageContainer>
    );
  }

  if (!status) {
    return (
      <PageContainer title="System Resilience" subtitle="Self-stabilizing distributed diagnostics">
        <EmptyState
          icon={Activity}
          title="Resilience Telemetry Stale"
          description="Initiate an active rebalancing sequence to verify system survivability indicators."
        />
      </PageContainer>
    );
  }

  const { containment_state, degradation_state, recovery_actions, resilience_vector, recovery_timeline } = status;

  return (
    <PageContainer
      title="Runtime Resilience"
      subtitle="Self-Stabilizing Workload Balancers, Subsystem Isolators & Containment Console"
    >
      {/* Dynamic Resilience scoring vector */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        
        {/* Overall Survivability circle SVG */}
        <GlassPanel className="flex flex-col items-center justify-center p-6 border-indigo-500/10">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/30 mb-4">Overall Survivability</h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" className="stroke-white/[0.02] stroke-[8] fill-none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-indigo-500 stroke-[8] fill-none transition-all duration-1000"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * resilience_vector.overall_survivability)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {Math.round(resilience_vector.overall_survivability * 100)}%
              </span>
              <span className="text-[8px] font-mono text-indigo-400 mt-1 uppercase tracking-widest font-bold">
                SURVIVABLE
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* Resilience components progress bars */}
        <WorkspaceCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Survivability Vector Dimensions</SectionLabel>
              <span className="text-[10px] text-white/30 font-mono">Dynamic performance indices</span>
            </div>
            
            <div className="space-y-3.5">
              {[
                { label: 'Subsystem Containment success', score: resilience_vector.containment_quality, color: 'bg-emerald-400 border-emerald-400/20' },
                { label: 'Rebalancing Recovery Quality', score: resilience_vector.recovery_quality, color: 'bg-cyan-400 border-cyan-400/20' },
                { label: 'Degradation Stability profile', score: resilience_vector.degradation_stability, color: 'bg-indigo-400 border-indigo-400/20' },
                { label: 'Orchestration durability quotient', score: resilience_vector.orchestration_resilience, color: 'bg-amber-400 border-amber-400/20' },
                { label: 'Transport tunnel survivability', score: resilience_vector.transport_resilience, color: 'bg-slate-400 border-slate-400/20' }
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

      {/* Control Banner & Fault Simulator triggers */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        
        {/* Trigger controls banner */}
        <div className="flex flex-col justify-between p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h2 className="text-sm font-semibold text-white/80">Automated Containment Active</h2>
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              Resilience broker intercepts boundary exception bursts and circular loop cycles to safeguard transaction determinisms.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <select
              value={failureType}
              onChange={(e) => setFailureType(e.target.value as 'stream_disconnect' | 'prediction_drift' | 'system_overload')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-white/[0.08] text-xs text-white/60 focus:outline-none"
            >
              <option value="stream_disconnect">Transport Storm</option>
              <option value="prediction_drift">Prediction Drift</option>
              <option value="system_overload">System Overload</option>
            </select>

            <button
              onClick={triggerSimulation}
              disabled={acting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-400/20 text-xs font-semibold bg-rose-500/[0.06] text-rose-300 hover:bg-rose-500/[0.12] disabled:opacity-50 transition-all"
            >
              <Play size={10} />
              Simulate Failure
            </button>
          </div>
        </div>

        {/* Trigger Recovery rebalancers */}
        <div className="flex flex-col justify-between p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl">
          <div>
            <div className="flex items-center gap-2">
              <Heart size={13} className="text-cyan-400" />
              <h2 className="text-sm font-semibold text-white/80">Re-balance & Recover</h2>
            </div>
            <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
              Manually trigger synchronization catchup protocols and state checkpoint restores to restore all isolated systems.
            </p>
          </div>

          <button
            onClick={triggerRecovery}
            disabled={acting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-cyan-400/20 text-xs font-semibold bg-cyan-500/[0.06] text-cyan-300 hover:bg-cyan-500/[0.12] disabled:opacity-50 transition-all self-start mt-4"
          >
            <RefreshCw size={12} className={acting ? 'animate-spin' : ''} />
            Force Replay Restoration
          </button>
        </div>

      </div>

      {/* Main console content split */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Failure Containment & Degradation */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Failure Containment Surface */}
          <GlassPanel className={containment_state.runtime_risk_score > 0.3 ? "border-rose-500/20" : ""}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className={containment_state.runtime_risk_score > 0.3 ? "text-rose-400" : "text-emerald-400"} />
                <SectionLabel>Failure Containment Surface</SectionLabel>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
                containment_state.recovery_priority === 'CRITICAL' ? 'bg-rose-500/[0.08] text-rose-400 border-rose-400/20' :
                containment_state.recovery_priority === 'HIGH' ? 'bg-amber-500/[0.08] text-amber-400 border-amber-400/20' :
                'bg-cyan-500/[0.08] text-cyan-300 border-cyan-400/20'
              }`}>
                RISK: {containment_state.recovery_priority}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-white/50 font-sans leading-relaxed">{containment_state.containment_reason}</p>
              
              <div className="grid md:grid-cols-3 gap-4 border-t border-white/[0.04] pt-4">
                <div>
                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Isolated Subsystems</h5>
                  {containment_state.isolated_subsystems.length > 0 ? (
                    <div className="space-y-1.5">
                      {containment_state.isolated_subsystems.map((sub) => (
                        <div key={sub} className="text-xs font-semibold text-rose-300/80 px-2 py-1 rounded bg-rose-500/[0.04] border border-rose-500/10">
                          {sub}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/20 italic">None isolated.</div>
                  )}
                </div>

                <div>
                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Propagation Lockdowns</h5>
                  {containment_state.propagation_lockdowns.length > 0 ? (
                    <div className="space-y-1.5">
                      {containment_state.propagation_lockdowns.map((lock) => (
                        <div key={lock} className="text-xs font-semibold text-amber-300/80 px-2 py-1 rounded bg-amber-500/[0.04] border border-amber-500/10">
                          {lock}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/20 italic">None active.</div>
                  )}
                </div>

                <div>
                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Degraded Services</h5>
                  {containment_state.degraded_services.length > 0 ? (
                    <div className="space-y-1.5">
                      {containment_state.degraded_services.map((svc) => (
                        <div key={svc} className="text-xs font-semibold text-cyan-300/80 px-2 py-1 rounded bg-cyan-500/[0.04] border border-cyan-500/10">
                          {svc}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-white/20 italic">None active.</div>
                  )}
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Degradation State Workspace */}
          <GlassPanel>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-indigo-400" />
                <SectionLabel>Graceful Degradation State</SectionLabel>
              </div>
              <span className="text-[10px] text-white/30 font-mono">Stress Level: {Math.round((degradation_state.system_stress_ratio || 0) * 100)}%</span>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Degradation Profile</span>
                  <span className="text-sm font-bold text-indigo-300 mt-1 block">{degradation_state.active_profile}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono block">Telemetry Suppression</span>
                  <span className="text-xs font-bold text-white/70 mt-1 block">
                    {degradation_state.expensive_telemetry_disabled ? "ACTIVE (Throttled)" : "OPTIMAL (Full)"}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs font-mono text-white/50">
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span>Prediction pacing latency</span>
                  <span className="font-bold text-white">{degradation_state.prediction_pacing_seconds}s</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                  <span>Transport broadcast rate</span>
                  <span className="font-bold text-white">{Math.round(degradation_state.transport_broadcast_rate * 100)}%</span>
                </div>
              </div>

              {degradation_state.suspended_features && degradation_state.suspended_features.length > 0 && (
                <div>
                  <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Suspended Features</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {degradation_state.suspended_features.map((feat) => (
                      <span key={feat} className="text-[9px] px-2 py-0.5 rounded bg-rose-500/[0.06] border border-rose-500/20 text-rose-400 font-medium">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassPanel>

        </div>

        {/* Right Column: Timeline & Recovery Actions */}
        <div className="space-y-6">
          
          {/* Recovery Actions List */}
          <WorkspaceCard>
            <SectionLabel>Restoration Quality Audit</SectionLabel>
            <div className="space-y-3 mt-4">
              {recovery_actions.map((act, i) => (
                <div key={i} className="p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-lg transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/80">{act.component_name}</span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      act.reconstruction_successful ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {act.reconstruction_successful ? 'RESTORED' : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-normal">{act.action_taken}</p>
                </div>
              ))}
            </div>
          </WorkspaceCard>

          {/* Recovery Timeline Explorer */}
          <WorkspaceCard>
            <SectionLabel>Recovery Timeline Explorer</SectionLabel>
            
            <div className="relative pl-5 border-l border-white/[0.06] ml-2 mt-4 space-y-5">
              {recovery_timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[28px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 border ${
                    step.status === 'DANGER' ? 'border-rose-500 bg-rose-500/20' :
                    step.status === 'WARNING' ? 'border-amber-500 bg-amber-500/20' :
                    'border-emerald-500 bg-emerald-500/20'
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
