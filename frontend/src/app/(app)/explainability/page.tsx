'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Panel, SectionHeader } from '@/components/ds';
import { env } from '@/lib/env';
import { Brain, Scale, AlertTriangle, RefreshCw } from 'lucide-react';

// === Type Declarations matching backend REST contract ===

interface SourceSignals {
  skill_count_raw: number;
  outreach_target_coeff: number;
  consistency_factor: number;
  current_market_fit: number;
}

interface WeightingBreakdownData {
  skills_importance: number;
  outreach_importance: number;
  execution_importance: number;
}

interface InfluenceChain {
  source_signals: SourceSignals;
  weighting_breakdown: WeightingBreakdownData;
  confidence_impact: number;
  affected_predictions: string[];
  strategic_reasoning_summary: string;
}

interface CausalExplanation {
  node_title: string;
  summary: string;
  causal_factors: string[];
  urgency_level: string;
  market_signal_verified: boolean;
}

interface DecisionTrace {
  trace_id: string;
  timestamp: string;
  actor: string;
  action: string;
  rationale: string;
}

interface ProjectionCheckpoint {
  week: number;
  phase: string;
  milestone: string;
  projected_velocity: number;
  projected_leverage: number;
  leverage_gain: string;
  visibility_decay: number;
}

interface ReasoningResponse {
  influence_chain: InfluenceChain;
  causal_explanations: CausalExplanation[];
  decision_traces: DecisionTrace[];
  reasoning_compiled_at: string;
  projection_timeline: ProjectionCheckpoint[];
}

interface LineageNode {
  id: string;
  label: string;
  category: 'INPUT' | 'CALIBRATION' | 'OPTIMIZATION';
  value: number;
}

interface LineageEdge {
  source: string;
  target: string;
  weight: number;
  description: string;
}

interface LineageResponse {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

interface ConfidenceExplanation {
  summary: string;
  strengths: string[];
  uncertainty_factors: string[];
  uncertainty_level: string;
}

interface CalibrationEvent {
  iteration: number;
  timestamp: string;
  snapshot_name: string;
  evaluated_accuracy: number;
  actual_outcome: Record<string, number>;
}

interface WeightingBreakdownDetails {
  baseline_weights: Record<string, number>;
  calibration_coefficients: Record<string, number>;
  calibrated_weights: Record<string, number>;
  explanation: string;
}

interface ConfidenceResponse {
  confidence_explanation: ConfidenceExplanation;
  calibration_history: CalibrationEvent[];
  weighting_breakdown: WeightingBreakdownDetails;
  confidence_vector: Record<string, number>;
}

interface OptimizationTraceItem {
  node_title: string;
  raw_index: number | null;
  optimized_index: number;
  position_shift: 'UP' | 'DOWN' | 'STABLE' | 'NEW';
  shift_description: string;
  compound_priority_score: number;
  difficulty_level: string;
  duration_weeks: number;
  reasoning_reason: string;
}

interface PriorityRankItem {
  rank: number;
  node_title: string;
  compound_priority_score: number;
  delta_to_next: number;
  ranking_description: string;
  target_leverage_delta: string;
}

interface LeverageExplanation {
  node_title: string;
  compound_priority_score: number;
  base_leverage: number;
  difficulty_divider: number;
  urgency_multiplier: number;
  projected_career_velocity_delta: string;
  leverage_class: string;
  calculation_steps: string[];
  summary: string;
}

interface OptimizationResponse {
  optimization_trace: OptimizationTraceItem[];
  priority_trace: PriorityRankItem[];
  leverage_explanations: LeverageExplanation[];
}

interface DriftCausalFactor {
  factor_type: string;
  severity: string;
  description: string;
  impact: string;
}

interface DriftDiagnostics {
  summary: string;
  overall_risk_factor: string;
  risk_score: number;
  causal_factors: DriftCausalFactor[];
  reconstruction_path: string[];
}

interface DriftResponse {
  raw_drift_signals: unknown[];
  drift_diagnostics: DriftDiagnostics;
}

// Coordinate mapping for SVG prediction lineage graph
const nodePositions: Record<string, { x: number; y: number }> = {
  skills_input: { x: 70, y: 70 },
  outreach_input: { x: 70, y: 190 },
  consistency_input: { x: 70, y: 310 },

  calibration_match: { x: 260, y: 50 },
  calibration_velocity: { x: 260, y: 130 },
  calibration_market: { x: 260, y: 210 },
  calibration_recruiter: { x: 260, y: 290 },

  opt_roadmap: { x: 450, y: 110 },
  opt_outreach: { x: 450, y: 250 }
};

export default function ExplainabilityDashboard() {
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState('');

  // Response states
  const [reasoningData, setReasoningData] = useState<ReasoningResponse | null>(null);
  const [lineageData, setLineageData] = useState<LineageResponse | null>(null);
  const [confidenceData, setConfidenceData] = useState<ConfidenceResponse | null>(null);
  const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);
  const [driftData, setDriftData] = useState<DriftResponse | null>(null);

  // UI Interactive States
  const [selectedPriorityNode, setSelectedPriorityNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const fetchExplainabilityDetails = useCallback(async () => {
    setLoading(true);
    setErrorState('');

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [resReasoning, resLineage, resConfidence, resOptimization, resDrift] = await Promise.all([
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/explainability/reasoning`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/explainability/lineage`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/explainability/confidence`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/explainability/optimization`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/explainability/drift`, { headers })
      ]);

      if (!resReasoning.ok || !resLineage.ok || !resConfidence.ok || !resOptimization.ok || !resDrift.ok) {
        throw new Error('Failed to retrieve explainability datasets from API router.');
      }

      const dataReasoning = await resReasoning.json() as unknown;
      const dataLineage = await resLineage.json() as unknown;
      const dataConfidence = await resConfidence.json() as unknown;
      const dataOptimization = await resOptimization.json() as unknown;
      const dataDrift = await resDrift.json() as unknown;

      setReasoningData(dataReasoning as ReasoningResponse);
      setLineageData(dataLineage as LineageResponse);
      setConfidenceData(dataConfidence as ConfidenceResponse);
      setOptimizationData(dataOptimization as OptimizationResponse);
      setDriftData(dataDrift as DriftResponse);

      const opt = dataOptimization as OptimizationResponse;
      const firstExplanation = opt.leverage_explanations[0];
      if (firstExplanation) {
        setSelectedPriorityNode(firstExplanation.node_title);
      }

    } catch (e: unknown) {
      setErrorState(e instanceof Error ? e.message : 'Unknown exception occurred during data sync.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExplainabilityDetails();
  }, [fetchExplainabilityDetails]);

  if (loading) {
    return (
      <PageContainer title="Explainable Strategic Intelligence" subtitle="Tracing core trajectory algorithms, confidence calibrations, and causal models.">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          <span className="text-xs text-slate-500 font-mono">Retrieving active trace telemetry...</span>
        </div>
      </PageContainer>
    );
  }

  if (errorState) {
    return (
      <PageContainer title="Explainable Strategic Intelligence" subtitle="Tracing core trajectory algorithms, confidence calibrations, and causal models.">
        <div className="p-6 border border-error/20 bg-error/5 rounded-xl flex flex-col gap-3">
          <SectionHeader title="Explainability Runtime Fault" />
          <p className="text-xs text-error font-mono">{errorState}</p>
          <button
            onClick={fetchExplainabilityDetails}
            className="w-fit px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700 font-mono flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> Retry Diagnostics Pull
          </button>
        </div>
      </PageContainer>
    );
  }

  const selectedLevDetail = optimizationData?.leverage_explanations.find(e => e.node_title === selectedPriorityNode);
  const activeCalibration = confidenceData?.confidence_vector?.calibrated_confidence ?? 0.8;
  const overallDriftRisk = driftData?.drift_diagnostics?.overall_risk_factor ?? 'LOW';

  return (
    <PageContainer
      title="Explainable Strategic Intelligence Console"
      subtitle="Expose raw pipeline metrics, auditable optimization equations, and self-calibrating reliability multipliers."
      actions={
        <button
          onClick={fetchExplainabilityDetails}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-white/[0.08] bg-white/[0.02] rounded-lg hover:bg-white/[0.06] transition-all"
        >
          <RefreshCw size={12} /> Re-Sync Traces
        </button>
      }
    >
      {/* 1. TOP OVERVIEW SUMMARY STRIP */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Panel className="flex items-center justify-between p-4 border-white/[0.04] bg-gradient-to-br from-indigo-950/20 to-slate-900/10">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Calibrated Confidence</span>
            <span className="text-2xl font-bold text-white font-mono">{Math.round(activeCalibration * 100)}%</span>
          </div>
          <Brain size={24} className="text-indigo-400 opacity-60" />
        </Panel>

        <Panel className="flex items-center justify-between p-4 border-white/[0.04] bg-gradient-to-br from-orange-950/20 to-slate-900/10">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Trajectory Drift Risk</span>
            <span className={`text-2xl font-bold font-mono ${
              overallDriftRisk === 'CRITICAL' ? 'text-red-400' :
              overallDriftRisk === 'HIGH' ? 'text-amber-500' :
              overallDriftRisk === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'
            }`}>{overallDriftRisk}</span>
          </div>
          <AlertTriangle size={24} className="text-amber-500 opacity-60" />
        </Panel>

        <Panel className="flex items-center justify-between p-4 border-white/[0.04] bg-gradient-to-br from-emerald-950/20 to-slate-900/10">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Decision Node Count</span>
            <span className="text-2xl font-bold text-white font-mono">{optimizationData?.priority_trace.length ?? 0} active</span>
          </div>
          <Scale size={24} className="text-emerald-400 opacity-60" />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Reasoning & Diagnostics Workspace */}
        <div className="lg:col-span-1 space-y-6">

          {/* Strategic Reasoning Console */}
          <Panel className="border-white/[0.04] bg-[#070b13]">
            <SectionHeader title="Strategic Reasoning Console" subtitle="Active influence chains propagating through runtime" />

            {reasoningData?.influence_chain && (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block mb-1">Influence Summary</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {reasoningData.influence_chain.strategic_reasoning_summary}
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/[0.04] pt-4">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Signal Strengths</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-surface-inset rounded border border-white/[0.03] text-center font-mono">
                      <span className="text-[8px] text-slate-500 uppercase block">Skill Targets</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{reasoningData.influence_chain.source_signals.skill_count_raw} tags</span>
                    </div>
                    <div className="p-2 bg-surface-inset rounded border border-white/[0.03] text-center font-mono">
                      <span className="text-[8px] text-slate-500 uppercase block">Consistency</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{Math.round(reasoningData.influence_chain.source_signals.consistency_factor * 100)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-white/[0.04] pt-4">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Affected Predictions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {reasoningData.influence_chain.affected_predictions.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-white/[0.06] text-[9px] text-slate-400 font-mono">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {/* Drift Diagnostics Workspace */}
          <Panel className="border-white/[0.04] bg-[#070b13]">
            <SectionHeader title="Drift Diagnostics Workspace" subtitle="Tracking stagnation factors and reconstruction paths" />

            {driftData?.drift_diagnostics && (
              <div className="mt-4 space-y-4">
                <div className="p-3 border border-orange-500/20 bg-orange-950/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-orange-400 font-mono font-bold uppercase tracking-wider">stagnation risk score</span>
                    <span className="text-xs font-bold text-orange-400 font-mono">{driftData.drift_diagnostics.risk_score} / 100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1.5 font-mono">
                    {driftData.drift_diagnostics.summary}
                  </p>
                </div>

                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Causal Indicators</span>
                  <div className="space-y-2">
                    {driftData.drift_diagnostics.causal_factors.map((cf, idx) => (
                      <div key={idx} className="p-2 border border-white/[0.04] bg-white/[0.005] rounded font-mono">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-semibold text-slate-300">{cf.factor_type.replace(/_/g, ' ')}</span>
                          <span className={`text-[8px] font-bold px-1 rounded ${
                            cf.severity === 'CRITICAL' ? 'text-red-400 bg-red-950/20' :
                            cf.severity === 'HIGH' ? 'text-amber-500 bg-amber-950/20' :
                            cf.severity === 'MEDIUM' ? 'text-yellow-400 bg-yellow-950/20' : 'text-slate-400 bg-slate-800'
                          }`}>{cf.severity}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">{cf.description}</p>
                        <p className="text-[9px] text-slate-500 mt-1 italic">Impact: {cf.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Reconstruction Path</span>
                  <div className="space-y-1.5">
                    {driftData.drift_diagnostics.reconstruction_path.map((path, idx) => (
                      <div key={idx} className="flex gap-2 text-[10px] text-emerald-400 leading-normal font-mono pl-2 border-l border-emerald-500/20">
                        <span>✓</span>
                        <span>{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Panel>

        </div>

        {/* MIDDLE COLUMN: SVG Causal Lineage Graph & Projections */}
        <div className="lg:col-span-1 space-y-6">

          {/* SVG Prediction Lineage Graph */}
          <Panel className="border-white/[0.04] bg-[#070b13] relative overflow-hidden">
            <SectionHeader title="Prediction Lineage Graph" subtitle="SVG mapping of raw inputs to optimization gates" />

            {lineageData && (
              <div className="mt-4 flex flex-col items-center">
                {/* SVG element */}
                <div className="relative border border-white/[0.04] bg-[#020617] rounded-xl p-2 w-full">
                  <svg width="100%" height="380" viewBox="0 0 520 380" className="max-w-full">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="hsl(var(--accent))" />
                      </marker>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Draw Edges */}
                    {lineageData.edges.map((edge, idx) => {
                      const posA = nodePositions[edge.source];
                      const posB = nodePositions[edge.target];
                      if (!posA || !posB) return null;

                      const isTargetHovered = hoveredNode === edge.source || hoveredNode === edge.target;

                      return (
                        <g key={idx}>
                          <path
                            d={`M ${posA.x + 35} ${posA.y} C ${(posA.x + posB.x) / 2} ${posA.y}, ${(posA.x + posB.x) / 2} ${posB.y}, ${posB.x - 35} ${posB.y}`}
                            stroke={isTargetHovered ? 'hsl(var(--accent))' : 'rgba(255,255,255,0.06)'}
                            strokeWidth={isTargetHovered ? '2' : '1'}
                            fill="none"
                            markerEnd="url(#arrow)"
                            className="transition-all duration-300"
                            filter={isTargetHovered ? 'url(#glow)' : undefined}
                          />
                        </g>
                      );
                    })}

                    {/* Draw Nodes */}
                    {lineageData.nodes.map((node) => {
                      const pos = nodePositions[node.id];
                      if (!pos) return null;

                      const isHovered = hoveredNode === node.id;
                      const styleClass =
                        node.category === 'INPUT' ? 'border-sky-400 text-sky-400 bg-sky-950/20' :
                        node.category === 'CALIBRATION' ? 'border-violet-400 text-violet-400 bg-violet-950/20' :
                        'border-emerald-400 text-emerald-400 bg-emerald-950/20';

                      return (
                        <foreignObject
                          key={node.id}
                          x={pos.x - 45}
                          y={pos.y - 25}
                          width="90"
                          height="50"
                          onMouseEnter={() => setHoveredNode(node.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className="overflow-visible"
                        >
                          <div className={`flex flex-col items-center justify-center h-full text-center p-1.5 border rounded-lg text-[9px] font-mono select-none cursor-pointer transition-all duration-300 leading-tight ${styleClass} ${isHovered ? 'scale-105 shadow-[0_0_12px_rgba(52,211,153,0.15)] ring-1 ring-accent' : ''}`}>
                            <span className="font-semibold truncate w-full">{node.label.split(' (')[0]}</span>
                            <span className="text-[7px] opacity-50 font-bold uppercase mt-0.5 tracking-wider">{node.category}</span>
                          </div>
                        </foreignObject>
                      );
                    })}
                  </svg>
                </div>

                {/* Info block for hovered item */}
                <div className="w-full mt-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg min-h-[70px] flex items-center font-mono">
                  {hoveredNode ? (
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Causal Connection Insight</span>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {lineageData.edges.find(e => e.source === hoveredNode || e.target === hoveredNode)?.description ||
                         'Hover over nodes to inspect dynamic signal flow parameters.'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic text-center w-full">
                      Hover over graph nodes to trace causal data pipeline logic.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Panel>

          {/* Timeline Projections Panel */}
          <Panel className="border-white/[0.04] bg-[#070b13]">
            <SectionHeader title="Simulation Timeline projections" subtitle="Milestone checkpoints over 12 weeks" />

            {reasoningData?.projection_timeline && (
              <div className="mt-4 space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                {reasoningData.projection_timeline.map((item, idx) => (
                  <div key={idx} className="p-2 border border-white/[0.03] bg-white/[0.005] rounded flex items-start gap-2.5 font-mono">
                    <span className="text-xs font-bold text-accent px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.05]">W{item.week}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-300">{item.phase}</span>
                        <span className="text-[8px] font-bold text-slate-500">{item.leverage_gain} leverage</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug mt-0.5 truncate">{item.milestone}</p>
                      <div className="flex gap-3 text-[8px] text-slate-500 mt-1 border-t border-white/[0.02] pt-1">
                        <span>Velocity: {Math.round(item.projected_velocity)}%</span>
                        <span>Visibility: {Math.round(item.visibility_decay)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

        </div>

        {/* RIGHT COLUMN: Optimization Trace, Calibration & Leverage */}
        <div className="lg:col-span-1 space-y-6">

          {/* Optimization Trace & Rankings */}
          <Panel className="border-white/[0.04] bg-[#070b13]">
            <SectionHeader title="Optimization Trace Panel" subtitle="Sequence changes sorted by compound priority score" />

            {optimizationData?.priority_trace && (
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {optimizationData.priority_trace.map((node) => {
                    const traceItem = optimizationData.optimization_trace.find(t => t.node_title === node.node_title);
                    const isSelected = selectedPriorityNode === node.node_title;

                    return (
                      <div
                        key={node.rank}
                        onClick={() => setSelectedPriorityNode(node.node_title)}
                        className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-center justify-between font-mono ${
                          isSelected ? 'border-accent/40 bg-accent/[0.02]' : 'border-white/[0.04] bg-white/[0.005] hover:border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-white/[0.06] rounded px-1">{node.rank}</span>
                          <div>
                            <span className="text-xs font-semibold text-slate-300 block">{node.node_title}</span>
                            <span className="text-[9px] text-slate-500 block leading-none mt-0.5">{node.ranking_description}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-accent block">{node.compound_priority_score}</span>
                          {traceItem && (
                            <span className={`text-[8px] font-bold rounded px-1 ${
                              traceItem.position_shift === 'UP' ? 'text-emerald-400 bg-emerald-950/20' :
                              traceItem.position_shift === 'DOWN' ? 'text-red-400 bg-red-950/20' : 'text-slate-400 bg-slate-800'
                            }`}>{traceItem.position_shift}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Leverage equation breakdown when node is selected */}
                {selectedLevDetail && (
                  <div className="mt-4 border-t border-white/[0.04] pt-4 space-y-3 font-mono">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{selectedLevDetail.node_title}</h4>
                        <span className="text-[8px] font-bold text-accent uppercase bg-accent/5 border border-accent/20 px-1 rounded mt-1 inline-block">
                          {selectedLevDetail.leverage_class.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase block">Projected Gain</span>
                        <span className="text-xs font-bold text-white">{selectedLevDetail.projected_career_velocity_delta} velocity</span>
                      </div>
                    </div>

                    <div className="p-3 bg-surface-inset border border-white/[0.03] rounded-lg text-[10px] space-y-1.5">
                      <span className="block text-[8px] text-slate-500 uppercase font-bold mb-1">Leverage Formula Step-by-Step</span>
                      {selectedLevDetail.calculation_steps.map((step, idx) => (
                        <div key={idx} className="text-slate-400 leading-normal pl-2 border-l border-indigo-500/20">
                          {step}
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed bg-white/[0.01] p-2 border border-white/[0.03] rounded">
                      {selectedLevDetail.summary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Panel>

          {/* Calibration History logs */}
          <Panel className="border-white/[0.04] bg-[#070b13]">
            <SectionHeader title="Calibration Trace History" subtitle="Self-calibrating error tracking timeline" />

            {confidenceData?.calibration_history && (
              <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {confidenceData.calibration_history.map((snap) => (
                  <div key={snap.iteration} className="p-2 border border-white/[0.03] bg-white/[0.005] rounded font-mono">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-semibold text-slate-300 truncate max-w-[170px]">{snap.snapshot_name}</span>
                      <span className="text-[8px] text-slate-500">{snap.timestamp.split('T')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">Evaluated Accuracy</span>
                      <span className="text-xs font-bold text-accent">{Math.round(snap.evaluated_accuracy * 100)}%</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-[8px] text-slate-500 mt-1.5 border-t border-white/[0.02] pt-1.5">
                      <div className="text-center">
                        <span className="block text-slate-600">Match</span>
                        <span className="font-semibold text-slate-400">{snap.actual_outcome.matchScore || 0}%</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-slate-600">Veloc</span>
                        <span className="font-semibold text-slate-400">{snap.actual_outcome.careerVelocity || 0}%</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-slate-600">Market</span>
                        <span className="font-semibold text-slate-400">{snap.actual_outcome.marketFit || 0}%</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-slate-600">Recru</span>
                        <span className="font-semibold text-slate-400">{snap.actual_outcome.recruiterConfidence || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

        </div>
      </div>
    </PageContainer>
  );
}
