'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useSimulationBoundary } from '@/runtime/stream/SimulationRuntimeBoundary';

interface ConfidenceDetails {
  prediction_confidence: number;
  data_density_score: number;
  market_signal_strength: number;
  recruiter_signal_strength: number;
  execution_reliability_score: number;
  calibrated_confidence: number;
  historical_accuracy_calibration: number;
}

interface SimulatedMetrics {
  matchScore: number;
  careerVelocity: number;
  marketFit: number;
  recruiterConfidence: number;
}

interface TrajectorySummary {
  probability_score: number;
  leverage_gain: string;
  market_alignment_shift: string;
  recruiter_visibility_delta: string;
  estimated_execution_cost: string;
  strategic_risk_score: string;
  reasoning_chain: string[];
}

interface WeeklyEngagement {
  week: number;
  search_appearances: number;
  profile_views: number;
}

interface OutreachFunnel {
  initial_contacts: number;
  projected_replies: number;
  projected_interviews: number;
  projected_offers: number;
  funnel_efficiency_score: number;
}

interface SkillRelevance {
  skill: string;
  current_relevance: number;
  projected_relevance_12m: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

interface DemandVolume {
  month: number;
  volume: number;
  growth_percentage: string;
}

interface CompensationProj {
  base_market_salary: number;
  projected_market_salary: number;
  growth_delta: number;
  percentile: number;
}

interface OpportunityWindow {
  role_category: string;
  status: 'OPEN' | 'OPENING_SOON' | 'CLOSING';
  days_remaining: number;
  urgency: string;
  leverage_requirement: string;
}

interface ExecutionStep {
  step: number;
  action: string;
  status: string;
}

interface RoadmapNode {
  phase: string;
  node_title: string;
  difficulty: string;
  estimated_weeks: number;
}

interface RiskFactors {
  stagnation_risk_ratio: number;
  skill_redundancy_risk: number;
  aggregate_risk_score: number;
}

interface LeveragePivot {
  pivot_name: string;
  impact: string;
  estimated_shift: string;
  required_action: string;
}

interface SimulationSnapshot {
  id?: string;
  name?: string;
  timestamp?: string;
  parameters?: {
    improved_skills: string[];
    shipped_projects: number;
    outreach_frequency: number;
    execution_consistency: number;
  };
  initial_metrics: SimulatedMetrics;
  simulated_metrics: SimulatedMetrics;
  trajectory_summary: TrajectorySummary;
  projections: {
    weeks: number;
    projected_velocity: number[];
    leverage_curve: { week: number; leverage: number; leverage_gain: string }[];
    visibility_decay: number[];
  };
  recruiter_forecast: {
    success_probability: number;
    rejection_risk: number;
    expected_responses: number;
    weekly_engagement: WeeklyEngagement[];
    outreach_funnel: OutreachFunnel;
  };
  market_alignment: {
    alignment_score: number;
    matched_trending_skills: string[];
    gap_count: number;
    skill_relevance_12m: SkillRelevance[];
    demand_volume_12m: DemandVolume[];
    compensation: CompensationProj;
  };
  strategy: {
    opportunity_windows: OpportunityWindow[];
    execution_path: ExecutionStep[];
    roadmap_nodes: RoadmapNode[];
    risk_factors: RiskFactors;
    leverage_pivots: LeveragePivot[];
  };
  drift_signals: {
    severity: 'critical' | 'warning' | 'info';
    affected_system: string;
    projected_long_term_impact: string;
    mitigation_path: string;
  }[];
  confidence_vector: ConfidenceDetails;
  accuracy_metric?: number | null;
  actual_outcome_compared?: SimulatedMetrics | null;
}

const AVAILABLE_SKILLS = [
  'FastAPI',
  'Next.js',
  'TypeScript',
  'Docker',
  'Redis',
  'PostgreSQL',
  'Kubernetes',
  'Python'
];

export default function PredictiveWorkspace() {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<SimulationSnapshot[]>([]);
  const [activeResult, setActiveResult] = useState<SimulationSnapshot | null>(null);
  const [driftWarnings, setDriftWarnings] = useState<SimulationSnapshot['drift_signals']>([]);

  const { setIsSimulationActive } = useSimulationBoundary();
  useEffect(() => {
    setIsSimulationActive(activeResult !== null);
    return () => setIsSimulationActive(false);
  }, [activeResult, setIsSimulationActive]);

  // Simulation input variables
  const [scenarioName, setScenarioName] = useState('Production Scaling Strategy');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['FastAPI', 'Next.js']);
  const [shippedProjects, setShippedProjects] = useState(1);
  const [outreachFrequency, setOutreachFrequency] = useState(0.6);
  const [executionConsistency, setExecutionConsistency] = useState(0.85);

  // Compare states
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  // Calibration states
  const [showCalibrate, setShowCalibrate] = useState(false);
  const [selectedSimForCalibrate, setSelectedSimForCalibrate] = useState('');
  const [calibMatchScore, setCalibMatchScore] = useState(94);
  const [calibCareerVelocity, setCalibCareerVelocity] = useState(78);
  const [calibMarketFit, setCalibMarketFit] = useState(91);
  const [calibRecruiterConfidence, setCalibRecruiterConfidence] = useState(87);
  const [calibrationSuccess, setCalibrationSuccess] = useState('');

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/prediction/history`, { headers });
      if (res.ok) {
        const data = await res.json() as unknown;
        setHistory(data as SimulationSnapshot[]);
      }
    } catch { /* Fail silently */ }
    setHistoryLoading(false);
  }, []);

  const fetchDrift = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/prediction/drift`, { headers });
      if (res.ok) {
        const data = await res.json() as unknown;
        setDriftWarnings(data as SimulationSnapshot['drift_signals']);
      }
    } catch { /* Fail silently */ }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchDrift();
  }, [fetchHistory, fetchDrift]);

  const triggerSimulation = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const payload = {
      name: scenarioName,
      improved_skills: selectedSkills,
      shipped_projects: shippedProjects,
      outreach_frequency: outreachFrequency,
      execution_consistency: executionConsistency,
      save_to_history: true
    };

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/prediction/simulate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json() as unknown;
        setActiveResult(data as SimulationSnapshot);
        fetchHistory(); // Refresh saved snaps list
      }
    } catch { /* error handling */ }
    setLoading(false);
  };

  const deleteSnapshot = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/prediction/snapshot/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        fetchHistory();
        if (activeResult?.id === id) {
          setActiveResult(null);
        }
      }
    } catch { /* fail */ }
  };

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const runCalibration = async () => {
    if (!selectedSimForCalibrate) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const payload = {
      snapshot_id: selectedSimForCalibrate,
      actual_outcome: {
        matchScore: calibMatchScore,
        careerVelocity: calibCareerVelocity,
        marketFit: calibMarketFit,
        recruiterConfidence: calibRecruiterConfidence
      }
    };

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/prediction/calibrate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setCalibrationSuccess('Model calibrated successfully!');
        fetchHistory();
        setTimeout(() => {
          setCalibrationSuccess('');
          setShowCalibrate(false);
        }, 2000);
      }
    } catch {
      setCalibrationSuccess('Calibration submission failed.');
    }
  };

  const compareSnapA = history.find(s => s.id === compareA);
  const compareSnapB = history.find(s => s.id === compareB);

  return (
    <PageContainer
      title="Predictive Orchestration Intelligence"
      subtitle="Simulate career trajectories, forecast recruiter outreach outcomes, and measure market alignment shifts inside isolated sandboxes"
      actions={
        <button
          onClick={() => setShowCalibrate(!showCalibrate)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent border border-accent/20 bg-accent/[0.04] rounded-lg hover:bg-accent/[0.1] hover:scale-[1.02] transition-all duration-200"
        >
          ⚙ Calibrate Predictor Model
        </button>
      }
    >
      {/* 1. Calibration Modal/Overlay Panel */}
      {showCalibrate && (
        <Panel className="border-accent/30 bg-black/40 backdrop-blur-md mb-6 relative">
          <SectionHeader
            title="Calibrate Predictor Engine Metrics"
            subtitle="Feed real career results into past predictions to align confidence multipliers."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Select Historical Scenario</label>
              <select
                className="w-full bg-surface-inset border border-white/[0.08] text-white text-xs rounded-lg p-2 focus:border-accent/50 outline-none"
                value={selectedSimForCalibrate}
                onChange={(e) => setSelectedSimForCalibrate(e.target.value)}
              >
                <option value="">-- Choose a past snapshot --</option>
                {history.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.timestamp?.split('T')[0]})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Actual Match Score ({calibMatchScore}%)</label>
              <input
                type="range" min="10" max="100"
                value={calibMatchScore}
                onChange={(e) => setCalibMatchScore(Number(e.target.value))}
                className="w-full accent-accent bg-white/[0.08]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Actual Career Velocity ({calibCareerVelocity}%)</label>
              <input
                type="range" min="10" max="100"
                value={calibCareerVelocity}
                onChange={(e) => setCalibCareerVelocity(Number(e.target.value))}
                className="w-full accent-accent bg-white/[0.08]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Actual Market Fit ({calibMarketFit}%)</label>
              <input
                type="range" min="10" max="100"
                value={calibMarketFit}
                onChange={(e) => setCalibMarketFit(Number(e.target.value))}
                className="w-full accent-accent bg-white/[0.08]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Actual Recruiter Confidence ({calibRecruiterConfidence}%)</label>
              <input
                type="range" min="10" max="100"
                value={calibRecruiterConfidence}
                onChange={(e) => setCalibRecruiterConfidence(Number(e.target.value))}
                className="w-full accent-accent bg-white/[0.08]"
              />
            </div>
            <div className="flex items-end justify-end">
              <button
                disabled={!selectedSimForCalibrate}
                onClick={runCalibration}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs font-semibold rounded-lg hover:from-blue-400 hover:to-violet-400 transition-colors disabled:opacity-40"
              >
                Submit Calibration Results
              </button>
            </div>
          </div>
          {calibrationSuccess && (
            <p className="mt-3 text-xs text-success font-semibold">{calibrationSuccess}</p>
          )}
          <button
            onClick={() => setShowCalibrate(false)}
            className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xs font-mono"
          >
            [Close]
          </button>
        </Panel>
      )}

      {/* 2. Active Drift Warnings */}
      {driftWarnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {driftWarnings.map((warning, idx) => (
            <Panel
              key={idx}
              className={`py-3 px-4 border border-l-4 transition-all hover:bg-white/[0.01] ${
                warning.severity === 'critical'
                  ? 'border-error/30 border-l-error bg-error/[0.015]'
                  : warning.severity === 'warning'
                  ? 'border-warning/30 border-l-warning bg-warning/[0.015]'
                  : 'border-white/[0.04] border-l-info bg-info/[0.01]'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge status={warning.severity === 'critical' ? 'error' : warning.severity === 'warning' ? 'warning' : 'info'}>
                    {warning.affected_system.toUpperCase()} DRIFT
                  </StatusBadge>
                  <span className="text-xs text-white/80 font-medium">{warning.projected_long_term_impact}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/40 font-mono">Mitigation: {warning.mitigation_path}</span>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Input Parameters Form */}
        <div className="lg:col-span-1 space-y-6">
          <Panel className="border-white/[0.04] bg-white/[0.01] backdrop-blur-md">
            <SectionHeader title="Simulation Parameters" subtitle="Configure isolated sandbox trajectory inputs" />

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] text-white/35 font-mono uppercase tracking-wider mb-1.5">Scenario Title</label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. AWS Core Platform Migration"
                  className="w-full bg-surface-inset border border-white/[0.06] text-white text-xs rounded-lg p-2.5 outline-none focus:border-accent/40"
                />
              </div>

              <div>
                <label className="block text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Target Skills to Leverage</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SKILLS.map(skill => {
                    const isChecked = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => handleSkillToggle(skill)}
                        className={`flex items-center justify-center p-2 text-xs border rounded-lg transition-all ${
                          isChecked
                            ? 'bg-accent/10 border-accent/40 text-accent font-medium'
                            : 'bg-white/[0.02] border-white/[0.04] text-white/40 hover:border-white/[0.08]'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/35 font-mono uppercase tracking-wider mb-1.5">
                  Engineering Projects to Ship: <span className="text-accent font-mono font-semibold">{shippedProjects}</span>
                </label>
                <input
                  type="range" min="0" max="5" step="1"
                  value={shippedProjects}
                  onChange={(e) => setShippedProjects(Number(e.target.value))}
                  className="w-full accent-accent bg-white/[0.06] h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-white/20 font-mono mt-0.5">
                  <span>0 (None)</span>
                  <span>5 (Maximum)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/35 font-mono uppercase tracking-wider mb-1.5">
                  Outreach Rhythmic Target: <span className="text-accent font-mono font-semibold">{Math.round(outreachFrequency * 100)}%</span>
                </label>
                <input
                  type="range" min="0.0" max="1.0" step="0.05"
                  value={outreachFrequency}
                  onChange={(e) => setOutreachFrequency(Number(e.target.value))}
                  className="w-full accent-accent bg-white/[0.06] h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-white/20 font-mono mt-0.5">
                  <span>Low Activity</span>
                  <span>Aggressive Cold outreach</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-white/35 font-mono uppercase tracking-wider mb-1.5">
                  Execution Consistency Coeff: <span className="text-accent font-mono font-semibold">{Math.round(executionConsistency * 100)}%</span>
                </label>
                <input
                  type="range" min="0.1" max="1.0" step="0.05"
                  value={executionConsistency}
                  onChange={(e) => setExecutionConsistency(Number(e.target.value))}
                  className="w-full accent-accent bg-white/[0.06] h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-white/20 font-mono mt-0.5">
                  <span>Erratic Commits</span>
                  <span>Structured Daily Commit Rhythms</span>
                </div>
              </div>

              <button
                onClick={triggerSimulation}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    <span>Orchestrating Sandbox Simulation...</span>
                  </>
                ) : (
                  <span>🚀 Execute Predictive Projections</span>
                )}
              </button>
            </div>
          </Panel>

          {/* HISTORICAL ARCHIVE SIDEBAR PANEL */}
          <Panel className="border-white/[0.04] bg-white/[0.01]">
            <SectionHeader title="Simulation Archive" subtitle="Recall previously generated sandboxes" />
            <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="text-center py-6 text-xs text-white/35 font-mono">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-6 text-xs text-white/20 leading-relaxed font-mono">No simulation logs stored in database.</div>
              ) : (
                history.map((snap) => (
                  <div
                    key={snap.id}
                    className={`p-3 border rounded-lg hover:border-white/[0.1] hover:bg-white/[0.02] transition-all cursor-pointer group ${
                      activeResult?.id === snap.id ? 'border-accent/40 bg-accent/[0.02]' : 'border-white/[0.04]'
                    }`}
                    onClick={() => setActiveResult(snap)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/80 truncate pr-1">{snap.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (snap.id) deleteSnapshot(snap.id);
                        }}
                        className="text-[10px] text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 font-mono"
                      >
                        [Delete]
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[9px] text-white/30 font-mono">
                      <span>{snap.timestamp ? `${snap.timestamp.split('T')[0]} ${snap.timestamp.split('T')[1]?.slice(0, 5) || ''}` : ''}</span>
                      <span className="text-accent font-semibold">Conf: {Math.round((snap.confidence_vector?.calibrated_confidence || 0) * 100)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: Output Simulation Results Console */}
        <div className="lg:col-span-2 space-y-6">
          {activeResult ? (
            <>
              {/* Confidence Vector Panel with Low-Confidence Degradation */}
              <Panel
                className={`border-white/[0.04] bg-white/[0.01] transition-all relative ${
                  activeResult.confidence_vector.prediction_confidence < 0.6
                    ? 'opacity-70 saturate-50 hover:opacity-100 hover:saturate-100 duration-500'
                    : ''
                }`}
              >
                {activeResult.confidence_vector.prediction_confidence < 0.6 && (
                  <div className="mb-4 p-2 text-[10px] border border-warning/30 bg-warning/5 rounded text-warning flex items-center gap-1.5 font-mono">
                    ⚠️ Low confidence threshold detected. Forecast predictions may degrade in consistency. Proceed with caution.
                  </div>
                )}

                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{activeResult.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono uppercase mt-0.5">
                      Executed at: {activeResult.timestamp ? activeResult.timestamp.replace('T', ' ').slice(0, 19) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/30 font-mono uppercase">Calibrated Confidence</p>
                    <p className="text-2xl font-bold text-accent font-mono">
                      {Math.round(activeResult.confidence_vector.calibrated_confidence * 100)}%
                    </p>
                    {activeResult.accuracy_metric !== null && (
                      <span className="text-[9px] text-success font-mono">
                        Verified Accuracy: {Math.round((activeResult.accuracy_metric || 0) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-confidence bars */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 border-t border-white/[0.04] pt-4">
                  <div>
                    <span className="block text-[9px] text-white/30 font-mono uppercase">Data Density</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${activeResult.confidence_vector.data_density_score * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-white/50 font-mono">{Math.round(activeResult.confidence_vector.data_density_score * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-white/30 font-mono uppercase">Market Strength</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400 rounded-full" style={{ width: `${activeResult.confidence_vector.market_signal_strength * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-white/50 font-mono">{Math.round(activeResult.confidence_vector.market_signal_strength * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-white/30 font-mono uppercase">Recruiter Strength</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${activeResult.confidence_vector.recruiter_signal_strength * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-white/50 font-mono">{Math.round(activeResult.confidence_vector.recruiter_signal_strength * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-white/30 font-mono uppercase">Execution Rel</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activeResult.confidence_vector.execution_reliability_score * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-white/50 font-mono">{Math.round(activeResult.confidence_vector.execution_reliability_score * 100)}%</span>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Trajectory comparison metrics (Before vs After) */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Panel className="p-4 border-white/[0.04] bg-white/[0.01]">
                  <span className="text-[9px] text-white/30 font-mono uppercase block">Match Score Shift</span>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {activeResult.initial_metrics.matchScore}% → <span className="text-accent font-semibold">{activeResult.simulated_metrics.matchScore}%</span>
                  </p>
                </Panel>
                <Panel className="p-4 border-white/[0.04] bg-white/[0.01]">
                  <span className="text-[9px] text-white/30 font-mono uppercase block">Execution Velocity</span>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {activeResult.initial_metrics.careerVelocity}% → <span className="text-accent font-semibold">{activeResult.simulated_metrics.careerVelocity}%</span>
                  </p>
                </Panel>
                <Panel className="p-4 border-white/[0.04] bg-white/[0.01]">
                  <span className="text-[9px] text-white/30 font-mono uppercase block">Market Fit</span>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {activeResult.initial_metrics.marketFit}% → <span className="text-accent font-semibold">{activeResult.simulated_metrics.marketFit}%</span>
                  </p>
                </Panel>
                <Panel className="p-4 border-white/[0.04] bg-white/[0.01]">
                  <span className="text-[9px] text-white/30 font-mono uppercase block">Recruiter Confidence</span>
                  <p className="text-lg font-bold text-white font-mono mt-1">
                    {activeResult.initial_metrics.recruiterConfidence}% → <span className="text-accent font-semibold">{activeResult.simulated_metrics.recruiterConfidence}%</span>
                  </p>
                </Panel>
              </div>

              {/* Trajectory projection chain & logic pathways */}
              <Panel className="border-white/[0.04] bg-white/[0.01]">
                <SectionHeader title="Simulated Trajectory Outcomes" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="p-3 bg-white/[0.005] border border-white/[0.03] rounded-lg">
                    <span className="text-[9px] text-white/35 font-mono uppercase block">Engagement Rate</span>
                    <span className="text-xl font-bold text-accent font-mono mt-1 block">{Math.round(activeResult.trajectory_summary.probability_score * 100)}%</span>
                  </div>
                  <div className="p-3 bg-white/[0.005] border border-white/[0.03] rounded-lg">
                    <span className="text-[9px] text-white/35 font-mono uppercase block">Leverage Impact</span>
                    <span className="text-xl font-bold text-accent font-mono mt-1 block">{activeResult.trajectory_summary.leverage_gain}</span>
                  </div>
                  <div className="p-3 bg-white/[0.005] border border-white/[0.03] rounded-lg">
                    <span className="text-[9px] text-white/35 font-mono uppercase block">Compensation Forecast</span>
                    <span className="text-xl font-bold text-accent font-mono mt-1 block">+{Math.round(activeResult.market_alignment.compensation.growth_delta).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-white/[0.04] pt-4">
                  <span className="block text-[10px] text-white/45 uppercase tracking-wider font-mono">Strategic Reasoning Chain</span>
                  {activeResult.trajectory_summary.reasoning_chain.map((chain, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-white/70 leading-relaxed font-mono pl-2 border-l border-accent/20">
                      <span>•</span>
                      <span>{chain}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Recruiter Visibility & Cold Outreach Funnel */}
              <div className="grid gap-6 md:grid-cols-2">
                <Panel className="border-white/[0.04] bg-white/[0.01]">
                  <SectionHeader title="Recruiter Outreach Campaign" subtitle="Projected conversions per 30 cold contacts" />
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Projected Replies</span>
                        <span className="font-semibold text-white font-mono">{activeResult.recruiter_forecast.outreach_funnel.projected_replies}</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(activeResult.recruiter_forecast.outreach_funnel.projected_replies / 30) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Projected Technical Interviews</span>
                        <span className="font-semibold text-white font-mono">{activeResult.recruiter_forecast.outreach_funnel.projected_interviews}</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(activeResult.recruiter_forecast.outreach_funnel.projected_interviews / 30) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Projected Job Offers</span>
                        <span className="font-semibold text-white font-mono">{activeResult.recruiter_forecast.outreach_funnel.projected_offers}</span>
                      </div>
                      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                        <div className="h-full bg-success rounded-full" style={{ width: `${(activeResult.recruiter_forecast.outreach_funnel.projected_offers / 30) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-[10px] text-white/30 text-right mt-1 font-mono">
                      Funnel Efficiency Coefficient: {activeResult.recruiter_forecast.outreach_funnel.funnel_efficiency_score}%
                    </div>
                  </div>
                </Panel>

                <Panel className="border-white/[0.04] bg-white/[0.01]">
                  <SectionHeader title="Opportunity Response Rates" subtitle="Outcomes adjusted by outreach volume" />
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                      <span className="text-white/60">Recruiter Response rate</span>
                      <span className="font-semibold text-accent font-mono">{Math.round(activeResult.recruiter_forecast.success_probability * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                      <span className="text-white/60">Expected Replies per 10 Messages</span>
                      <span className="font-semibold text-white font-mono">{activeResult.recruiter_forecast.expected_responses}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.04]">
                      <span className="text-white/60">Outreach Rejection Risk</span>
                      <span className="font-semibold text-error font-mono">{Math.round(activeResult.recruiter_forecast.rejection_risk * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-white/60">Estimated Search appearances (12-week max)</span>
                      <span className="font-semibold text-success font-mono">
                        {activeResult.recruiter_forecast.weekly_engagement[11]?.search_appearances || 0} / wk
                      </span>
                    </div>
                  </div>
                </Panel>
              </div>

              {/* Market alignment & Compensation & skill forecast */}
              <Panel className="border-white/[0.04] bg-white/[0.01]">
                <SectionHeader title="Domain Market Alignment Forecast" />
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase tracking-wider mb-2 font-mono">12-Month Skill Relevance Trend</span>
                    <div className="space-y-2.5">
                      {activeResult.market_alignment.skill_relevance_12m.map((sf, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white/[0.005] border border-white/[0.03] rounded">
                          <span className="font-semibold text-white/80">{sf.skill}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-white/30 font-mono">Relevance: {sf.current_relevance} → {sf.projected_relevance_12m}</span>
                            <StatusBadge status={sf.trend === 'UP' ? 'success' : sf.trend === 'DOWN' ? 'error' : 'neutral'}>
                              {sf.trend}
                            </StatusBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase tracking-wider mb-2 font-mono">Execution Growth & Salary Percentile</span>
                    <div className="p-4 bg-white/[0.005] border border-white/[0.03] rounded-lg space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span>Salary Percentile Match</span>
                          <span className="font-semibold text-white font-mono">{activeResult.market_alignment.compensation.percentile}th Percentile</span>
                        </div>
                        <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${activeResult.market_alignment.compensation.percentile}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/[0.04]">
                        <div>
                          <span className="text-white/35 block font-mono text-[9px] uppercase">Base Market Comp</span>
                          <span className="font-bold text-white/80 font-mono mt-0.5 block">{activeResult.market_alignment.compensation.base_market_salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                        </div>
                        <div>
                          <span className="text-white/35 block font-mono text-[9px] uppercase">Projected Comp</span>
                          <span className="font-bold text-accent font-mono mt-0.5 block">{activeResult.market_alignment.compensation.projected_market_salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Opportunity Timeline & learning paths */}
              <div className="grid gap-6 md:grid-cols-2">
                <Panel className="border-white/[0.04] bg-white/[0.01]">
                  <SectionHeader title="Opportunity Windows" subtitle="Days remaining before hiring cycle closures" />
                  <div className="mt-4 space-y-3">
                    {activeResult.strategy.opportunity_windows.map((win, idx) => (
                      <div key={idx} className="p-3 border border-white/[0.03] bg-white/[0.003] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white/80 truncate pr-1">{win.role_category}</span>
                          <StatusBadge status={win.status === 'OPEN' ? 'success' : win.status === 'CLOSING' ? 'error' : 'warning'}>
                            {win.status.replace('_', ' ')}
                          </StatusBadge>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-[10px] text-white/40 font-mono">
                          <span>{win.days_remaining} days left</span>
                          <span>Urgency: {win.urgency}</span>
                        </div>
                        <p className="mt-2 text-[10px] text-accent font-mono leading-relaxed">{win.leverage_requirement}</p>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="border-white/[0.04] bg-white/[0.01]">
                  <SectionHeader title="Sequential Action Steps & Risk Rates" />
                  <div className="mt-4 space-y-3 font-mono">
                    <span className="block text-[10px] text-white/45 uppercase tracking-wider">Acquisition Roadmaps</span>
                    <div className="space-y-2">
                      {activeResult.strategy.execution_path.map((path, idx) => (
                        <div key={idx} className="flex gap-2 text-xs p-2 bg-white/[0.005] border border-white/[0.03] rounded">
                          <span className="text-accent font-semibold">{path.step}.</span>
                          <span className="text-white/70">{path.action}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-white/35 text-[9px] uppercase block">Stagnation Risk</span>
                        <span className="font-bold text-warning font-mono mt-0.5 block">{Math.round(activeResult.strategy.risk_factors.stagnation_risk_ratio * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-white/35 text-[9px] uppercase block">Redundancy Risk</span>
                        <span className="font-bold text-error font-mono mt-0.5 block">{Math.round(activeResult.strategy.risk_factors.skill_redundancy_risk * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>

              {/* Side-by-Side Simulation Comparison Sandbox */}
              <Panel className="border-white/[0.04] bg-white/[0.01]">
                <SectionHeader title="Simulation Comparison Sandbox" subtitle="Evaluate metrics side-by-side between two scenarios" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1 font-mono">Scenario A</label>
                    <select
                      className="w-full bg-surface-inset border border-white/[0.06] text-white text-xs rounded-lg p-2 focus:border-accent/40 outline-none"
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                    >
                      <option value="">-- Choose Scenario --</option>
                      {history.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/35 uppercase tracking-wider mb-1 font-mono">Scenario B</label>
                    <select
                      className="w-full bg-surface-inset border border-white/[0.06] text-white text-xs rounded-lg p-2 focus:border-accent/40 outline-none"
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                    >
                      <option value="">-- Choose Scenario --</option>
                      {history.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {compareSnapA && compareSnapB ? (
                  <div className="mt-4 border-t border-white/[0.04] pt-4 overflow-x-auto">
                    <table className="w-full text-xs text-left text-white/70 font-mono">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-white/40">
                          <th className="py-2">Metric Dimension</th>
                          <th className="py-2 pr-2">{compareSnapA.name}</th>
                          <th className="py-2">{compareSnapB.name}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Calibrated Confidence</td>
                          <td className="py-2 pr-2 text-accent font-semibold">{Math.round((compareSnapA.confidence_vector?.calibrated_confidence || 0) * 100)}%</td>
                          <td className="py-2 text-accent font-semibold">{Math.round((compareSnapB.confidence_vector?.calibrated_confidence || 0) * 100)}%</td>
                        </tr>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Match Score</td>
                          <td className="py-2 pr-2">{compareSnapA.simulated_metrics.matchScore}%</td>
                          <td className="py-2">{compareSnapB.simulated_metrics.matchScore}%</td>
                        </tr>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Execution Velocity</td>
                          <td className="py-2 pr-2">{compareSnapA.simulated_metrics.careerVelocity}%</td>
                          <td className="py-2">{compareSnapB.simulated_metrics.careerVelocity}%</td>
                        </tr>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Market Fit Alignment</td>
                          <td className="py-2 pr-2">{compareSnapA.simulated_metrics.marketFit}%</td>
                          <td className="py-2">{compareSnapB.simulated_metrics.marketFit}%</td>
                        </tr>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Recruiter Confidence</td>
                          <td className="py-2 pr-2">{compareSnapA.simulated_metrics.recruiterConfidence}%</td>
                          <td className="py-2">{compareSnapB.simulated_metrics.recruiterConfidence}%</td>
                        </tr>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Opportunity Windows</td>
                          <td className="py-2 pr-2 text-success">{compareSnapA.strategy.opportunity_windows.length} Open</td>
                          <td className="py-2 text-success">{compareSnapB.strategy.opportunity_windows.length} Open</td>
                        </tr>
                        <tr className="border-b border-white/[0.02]">
                          <td className="py-2 font-medium">Projected Comp</td>
                          <td className="py-2 pr-2 font-semibold text-white">{compareSnapA.market_alignment.compensation.projected_market_salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                          <td className="py-2 font-semibold text-white">{compareSnapB.market_alignment.compensation.projected_market_salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Aggregate Risk Ratio</td>
                          <td className="py-2 pr-2 text-error">{Math.round((compareSnapA.strategy.risk_factors.aggregate_risk_score || 0) * 100)}%</td>
                          <td className="py-2 text-error">{Math.round((compareSnapB.strategy.risk_factors.aggregate_risk_score || 0) * 100)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4 text-center py-4 text-xs text-white/30 font-mono">
                    Select two simulation scenarios from history above to generate a side-by-side matrix comparison.
                  </div>
                )}
              </Panel>
            </>
          ) : (
            <Panel variant="inset" className="flex flex-col items-center justify-center text-center py-24 border-white/[0.04] bg-white/[0.015]">
              <div className="text-3xl mb-4">🔮</div>
              <p className="text-white/70 text-sm font-semibold">Predictive Orchestration Console Idle</p>
              <p className="text-white/30 text-xs mt-2 max-w-sm leading-relaxed">
                Adjust parameters on the left and execute to run isolated career projections, recruiter engagement metrics, and market alignment forecasts.
              </p>
            </Panel>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
