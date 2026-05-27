'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from '@/lib/env';
import {
  PageContainer,
  DashboardGrid,
  MetricCard,
  GlassPanel,
  SectionLabel,
  WorkspaceCard,
  LoadingPulse,
  EmptyState
} from '@/components/workspace';
import {
  Shield,
  Activity,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Layers,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';

interface OrchestrationHealth {
  runtime_stability_score: number;
  propagation_integrity_score: number;
  topology_coherence_score: number;
  orchestration_latency: number;
  degraded_cycle_count: number;
  replay_alignment_score: number;
}

interface PredictionDrift {
  drift_coefficient: number;
  confidence_decay_rate: number;
  calibration_stability: number;
  drift_diagnostics: string;
}

interface ReplayAudit {
  determinism_index: number;
  snapshot_integrity_score: number;
  divergence_count: number;
  reproducibility_intact: boolean;
}

interface TransportHealth {
  uptime_ratio: number;
  reconnect_frequency: number;
  payload_corruption_rate: number;
  synchronization_delay_ms: number;
  heartbeat_quality: number;
}

interface RuntimeHealth {
  memory_consumption_mb: number;
  memory_limit_mb: number;
  async_task_cancellations: number;
  performance_degradation_score: number;
  system_load_percent: number;
}

interface TrustVector {
  orchestration_trust: number;
  prediction_trust: number;
  replay_trust: number;
  synchronization_trust: number;
  transport_trust: number;
  overall_runtime_trust: number;
}

interface Anomaly {
  timestamp: number;
  component: string;
  event: string;
  level: string;
  message: string;
}

interface HistoryStep {
  timestamp: number;
  cycle: number;
  overall_trust: number;
  orchestration_latency_ms: number;
  reconnect_count: number;
}

export default function ObservabilityPage() {
  const [status, setStatus] = useState<{
    orchestration_health: OrchestrationHealth;
    prediction_drift: PredictionDrift;
    replay_audit: ReplayAudit;
    transport_health: TransportHealth;
    runtime_health: RuntimeHealth;
    trust_vector: TrustVector;
    anomalies: Anomaly[];
  } | null>(null);
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'anomalies' | 'charts'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/observability/status`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/observability/history`, { headers })
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
    } catch (e) {
      console.error("Error fetching operational observability status: ", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAudit = async () => {
    setAuditing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/observability/audit`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        // Refresh status after triggering auditing
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <PageContainer title="System Observability" subtitle="Distributed diagnostics infrastructure">
        <LoadingPulse rows={8} />
      </PageContainer>
    );
  }

  if (!status) {
    return (
      <PageContainer title="System Observability" subtitle="Distributed diagnostics infrastructure">
        <EmptyState
          icon={Shield}
          title="Telemetry Data Stale"
          description="Initiate an active operational diagnostic loop to verify runtime trust indicators."
        />
      </PageContainer>
    );
  }

  const { orchestration_health, prediction_drift, replay_audit, transport_health, runtime_health, trust_vector, anomalies } = status;

  // Render SVG Trust and Latency Chart
  const renderHistoryChart = () => {
    if (!history || history.length === 0) return null;

    const width = 500;
    const height = 150;
    const padding = 20;

    // Scale coordinates
    const getCoordinates = (index: number, trustVal: number, latencyVal: number) => {
      const x = padding + (index / (history.length - 1)) * (width - padding * 2);
      // Trust scaled 0.8 to 1.0
      const yTrust = height - padding - ((trustVal - 0.8) / 0.2) * (height - padding * 2);
      // Latency scaled 80 to 140
      const yLatency = height - padding - ((latencyVal - 80) / 60) * (height - padding * 2);
      return { x, yTrust, yLatency };
    };

    const coords = history.map((h, i) => getCoordinates(i, h.overall_trust, h.orchestration_latency_ms));

    const generateTrustPath = () => {
      return coords.reduce((acc, c, i) => {
        if (i === 0) return `M ${c.x} ${c.yTrust}`;
        const prev = coords[i - 1];
        if (!prev) return acc;
        const cpX1 = prev.x + (c.x - prev.x) / 2;
        const cpY1 = prev.yTrust;
        const cpX2 = prev.x + (c.x - prev.x) / 2;
        const cpY2 = c.yTrust;
        return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${c.x} ${c.yTrust}`;
      }, '');
    };

    const generateLatencyPath = () => {
      return coords.reduce((acc, c, i) => {
        if (i === 0) return `M ${c.x} ${c.yLatency}`;
        const prev = coords[i - 1];
        if (!prev) return acc;
        const cpX1 = prev.x + (c.x - prev.x) / 2;
        const cpY1 = prev.yLatency;
        const cpX2 = prev.x + (c.x - prev.x) / 2;
        const cpY2 = c.yLatency;
        return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${c.x} ${c.yLatency}`;
      }, '');
    };

    return (
      <div className="relative w-full overflow-hidden bg-white/[0.01] border border-white/[0.04] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Coherence History Tracker</SectionLabel>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white/40">Overall Trust</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-white/40">Orchestration Latency</span>
            </div>
          </div>
        </div>
        
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
          
          <path d={generateTrustPath()} fill="none" stroke="#34d399" strokeWidth="2.5" />
          <path d={generateLatencyPath()} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="2" />

          {/* Trust Points */}
          {coords.map((c, i) => (
            <g key={`t-${i}`} className="group cursor-pointer">
              <circle cx={c.x} cy={c.yTrust} r="4" className="fill-emerald-400 stroke-emerald-900 stroke-2 hover:r-5 transition-all" />
              <text x={c.x} y={c.yTrust - 8} className="text-[7px] font-mono fill-emerald-300" textAnchor="middle">
                {((history[i]?.overall_trust ?? 0) * 100).toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Latency Points */}
          {coords.map((c, i) => (
            <g key={`lat-${i}`} className="group cursor-pointer">
              <circle cx={c.x} cy={c.yLatency} r="3" className="fill-cyan-400 stroke-cyan-950 stroke-2 hover:r-4 transition-all" />
              <text x={c.x} y={c.yLatency + 11} className="text-[7px] font-mono fill-cyan-300" textAnchor="middle">
                {history[i]?.orchestration_latency_ms ?? 0}ms
              </text>
            </g>
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-[9px] font-mono text-white/20">
          <span>Cycle 1</span>
          <span>Cycle 2</span>
          <span>Cycle 3</span>
          <span>Cycle 4</span>
          <span>Cycle 5</span>
          <span>Cycle 6 (Active)</span>
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title="Runtime Observability"
      subtitle="Operational System Integrity, Replay Determinism & Diagnostic Console"
    >
      {/* Dynamic Trust Score Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        
        {/* Overall Trust gauge (Left Column) */}
        <GlassPanel className="flex flex-col items-center justify-center p-6 border-emerald-500/10">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/30 mb-4">Overall Operational Trust</h3>
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="40" className="stroke-white/[0.02] stroke-[8] fill-none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400 stroke-[8] fill-none transition-all duration-1000"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * trust_vector.overall_runtime_trust)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {Math.round(trust_vector.overall_runtime_trust * 100)}%
              </span>
              <span className="text-[8px] font-mono text-emerald-400 mt-1 uppercase tracking-widest font-bold">
                COHERENT
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* trust vector dimensions (Right 2 Columns) */}
        <WorkspaceCard className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Strategic Trust Vector</SectionLabel>
              <span className="text-[10px] text-white/30 font-mono">Evidence-Based scoring model</span>
            </div>
            
            <div className="space-y-3.5">
              {[
                { label: 'Orchestration loop health', score: trust_vector.orchestration_trust, color: 'bg-emerald-400 border-emerald-400/20' },
                { label: 'Predictive Calibration strength', score: trust_vector.prediction_trust, color: 'bg-indigo-400 border-indigo-400/20' },
                { label: 'Replay transition determinism', score: trust_vector.replay_trust, color: 'bg-cyan-400 border-cyan-400/20' },
                { label: 'Synchronization coherence ratio', score: trust_vector.synchronization_trust, color: 'bg-amber-400 border-amber-400/20' },
                { label: 'Transport connection stability', score: trust_vector.transport_trust, color: 'bg-slate-400 border-slate-400/20' }
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

      {/* Control Banner Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl mb-6">
        <div className="flex gap-2">
          {(['overview', 'anomalies', 'charts'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all ${
                activeView === view
                  ? 'border-indigo-400/20 text-indigo-300 bg-indigo-500/[0.06]'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {view === 'overview' ? 'Operational Overview' : view === 'anomalies' ? 'Synchronization Audits' : 'System Performance Charts'}
            </button>
          ))}
        </div>

        <button
          onClick={triggerAudit}
          disabled={auditing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-400/20 text-xs font-semibold bg-indigo-500/[0.06] text-indigo-300 hover:bg-indigo-500/[0.12] disabled:opacity-50 transition-all self-end md:self-auto"
        >
          <RefreshCw size={12} className={auditing ? 'animate-spin' : ''} />
          {auditing ? 'Executing Runtime Audit...' : 'Trigger active Audit'}
        </button>
      </div>

      {/* VIEW CONTENT: Overview */}
      {activeView === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Orchestration Health */}
          <GlassPanel>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-emerald-400" />
              <SectionLabel>Orchestration Health Surface</SectionLabel>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-white/50">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Runtime Stability</span>
                <span className="font-bold text-white/80">{Math.round(orchestration_health.runtime_stability_score * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Propagation Integrity</span>
                <span className="font-bold text-white/80">{Math.round(orchestration_health.propagation_integrity_score * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Orchestration Latency</span>
                <span className="text-cyan-300 font-bold">{orchestration_health.orchestration_latency.toFixed(1)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Degraded Cycle Count</span>
                <span className={orchestration_health.degraded_cycle_count > 0 ? "text-amber-400 font-bold" : "text-white/80"}>
                  {orchestration_health.degraded_cycle_count} cycles
                </span>
              </div>
            </div>
          </GlassPanel>

          {/* Prediction Drift Diagnostics */}
          <GlassPanel>
            <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-indigo-400" />
              <SectionLabel>Prediction Drift Monitor</SectionLabel>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-white/50">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Forecast Divergence</span>
                <span className="font-bold text-white/80">{Math.round(prediction_drift.drift_coefficient * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Confidence Decay Rate</span>
                <span className="font-bold text-white/80">{Math.round(prediction_drift.confidence_decay_rate * 100)}%</span>
              </div>
              <div className="flex justify-between pb-1.5">
                <span>Calibration Stability</span>
                <span className="font-bold text-white/80">{Math.round(prediction_drift.calibration_stability * 100)}%</span>
              </div>
              <div className="p-2 rounded bg-white/[0.01] border border-white/[0.03] text-[10px] text-white/40 leading-relaxed font-sans">
                {prediction_drift.drift_diagnostics}
              </div>
            </div>
          </GlassPanel>

          {/* Replay Consistency Monitor */}
          <GlassPanel>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={14} className="text-cyan-400" />
              <SectionLabel>Replay Consistency Monitor</SectionLabel>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-white/50">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Determinism Index</span>
                <span className="font-bold text-emerald-400">{Math.round(replay_audit.determinism_index * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Snapshot checksum integrity</span>
                <span className="font-bold text-emerald-400">{Math.round(replay_audit.snapshot_integrity_score * 100)}%</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>State Divergence Count</span>
                <span className={replay_audit.divergence_count > 0 ? "text-rose-400 font-bold" : "text-white/80"}>
                  {replay_audit.divergence_count} mismatches
                </span>
              </div>
              <div className="flex justify-between">
                <span>Reproducibility verification</span>
                <span className={replay_audit.reproducibility_intact ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {replay_audit.reproducibility_intact ? "VALIDATED" : "FAILED"}
                </span>
              </div>
            </div>
          </GlassPanel>

          {/* Transport Stability Console */}
          <GlassPanel>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-amber-400" />
              <SectionLabel>Transport Stability Console</SectionLabel>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-white/50">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Stream Uptime Ratio</span>
                <span className="font-bold text-white/80">{(transport_health.uptime_ratio * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Reconnect Frequency</span>
                <span className="font-bold text-white/80">{transport_health.reconnect_frequency} drops/hr</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Payload Corruption Rate</span>
                <span className="font-bold text-white/80">{Math.round(transport_health.payload_corruption_rate * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Synchronization delay</span>
                <span className="font-bold text-cyan-300">{transport_health.synchronization_delay_ms.toFixed(1)}ms</span>
              </div>
            </div>
          </GlassPanel>

          {/* System Runtime checks */}
          <GlassPanel className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-white/50" />
                <SectionLabel>System Runtime Diagnostics</SectionLabel>
              </div>
              <span className="text-[10px] font-mono text-white/20">Operational metrics</span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg text-center font-mono">
                <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-1">Memory Allocation</span>
                <span className="text-lg font-bold text-white/85">
                  {runtime_health.memory_consumption_mb.toFixed(1)} <b className="text-xs text-white/30">MB</b>
                </span>
                <span className="text-[9px] text-white/20 block mt-1">Bound Limit: {runtime_health.memory_limit_mb}MB</span>
              </div>
              
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg text-center font-mono">
                <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-1">AsyncTask Cancellations</span>
                <span className="text-lg font-bold text-white/85">
                  {runtime_health.async_task_cancellations} <b className="text-xs text-white/30">tasks</b>
                </span>
                <span className="text-[9px] text-white/20 block mt-1">Status: Concurrency Stable</span>
              </div>

              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg text-center font-mono">
                <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-1">Performance Degradation</span>
                <span className="text-lg font-bold text-white/85">
                  {Math.round(runtime_health.performance_degradation_score * 100)}%
                </span>
                <span className="text-[9px] text-white/20 block mt-1">CPU Load: {runtime_health.system_load_percent}%</span>
              </div>
            </div>
          </GlassPanel>

        </div>
      )}

      {/* VIEW CONTENT: Anomalies/Synchronization Audits */}
      {activeView === 'anomalies' && (
        <GlassPanel>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-cyan-400" />
              <SectionLabel>Synchronization Audit Explorer</SectionLabel>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded border border-cyan-400/20 text-cyan-300 bg-cyan-500/[0.05] font-mono">
              Replay divergence traces
            </span>
          </div>

          {anomalies && anomalies.length > 0 ? (
            <div className="space-y-3">
              {anomalies.map((anom, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-lg transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        anom.level === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        anom.level === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      }`}>
                        {anom.level}
                      </span>
                      <span className="text-xs font-semibold text-white/80">{anom.component} • {anom.event}</span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed font-sans">{anom.message}</p>
                  </div>
                  <div className="text-[10px] font-mono text-white/20 flex-shrink-0">
                    {new Date(anom.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 font-mono text-xs">
              <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400/60" />
              No anomalies detected. All sync tunnels and transition check sums are completely validated.
            </div>
          )}
        </GlassPanel>
      )}

      {/* VIEW CONTENT: Performance History Charts */}
      {activeView === 'charts' && (
        <div className="space-y-6">
          {renderHistoryChart()}
        </div>
      )}

    </PageContainer>
  );
}
