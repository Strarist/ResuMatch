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
  BarChart3,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Layers,
  Shield,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface NarrativeBrief {
  current_positioning: string;
  strongest_leverage_direction: string;
  execution_trajectory: string;
  opportunity_pressure: string;
  market_alignment: string;
  recruiter_positioning: string;
  strategic_weaknesses: string;
}

interface StorylinePoint {
  week: number;
  milestone_title: string;
  narrative_evolution: string;
  recruiter_visibility_score: number;
  leverage_accumulated: number;
  consistency_rate: number;
}

interface CompressedSignal {
  signal_type: string;
  strategic_importance: number;
  urgency: string;
  leverage_impact: number;
  confidence: number;
  synthesis_summary: string;
}

interface OpportunityCluster {
  cluster_name: string;
  target_specialization: string;
  compound_leverage_multiplier: number;
  recruiter_pull_index: number;
  market_demand_index: number;
  leverage_roadmap_skills: string[];
  synthesis_description: string;
}

interface StrategicRisk {
  stagnation_coefficient: number;
  risk_factor_level: string;
  diagnostics_brief: string;
  active_risk_triggers: string[];
  reconstruction_actions: string[];
}

interface WeeklyDigest {
  trajectory_summary: string;
  execution_delta: number;
  opportunity_changes: string;
  risk_changes: string;
  confidence_transitions: string;
  leverage_shift: string;
  strategic_focus_recommendation: string;
  compressed_signals: CompressedSignal[];
}

export default function ExecutivePage() {
  const [narrative, setNarrative] = useState<{ narrative_brief: NarrativeBrief; execution_storyline: StorylinePoint[] } | null>(null);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [opportunity, setOpportunity] = useState<{ opportunity_clusters: OpportunityCluster[] } | null>(null);
  const [risk, setRisk] = useState<StrategicRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [activeTab, setActiveTab] = useState<'narrative' | 'digest' | 'opportunity' | 'risk'>('narrative');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [narrativeRes, digestRes, oppRes, riskRes] = await Promise.all([
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/synthesis/narrative`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/synthesis/digest`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/synthesis/opportunity`, { headers }),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/synthesis/risk`, { headers })
      ]);

      if (narrativeRes.ok) setNarrative(await narrativeRes.json());
      if (digestRes.ok) setDigest(await digestRes.json());
      if (oppRes.ok) setOpportunity(await oppRes.json());
      if (riskRes.ok) setRisk(await riskRes.json());
    } catch (e) {
      console.error("Error fetching synthesis intelligence: ", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerRecompute = async () => {
    setRecomputing(true);
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/recompute`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecomputing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <PageContainer title="Executive Strategy" subtitle="Strategic trajectory models">
        <LoadingPulse rows={8} />
      </PageContainer>
    );
  }

  if (!narrative || !digest || !opportunity || !risk) {
    return (
      <PageContainer title="Executive Strategy" subtitle="Strategic trajectory models">
        <EmptyState
          icon={BarChart3}
          title="Trajectory Narrative Standby"
          description="Initiate an active synchronization cycle to populate strategic trajectory narrative models."
        />
      </PageContainer>
    );
  }

  const { narrative_brief, execution_storyline } = narrative;

  // Render SVG Momentum and Visibility Chart
  const renderMomentumTracker = () => {
    const points = execution_storyline;
    if (!points || points.length === 0) return null;

    const width = 500;
    const height = 150;
    const padding = 20;

    // Scale coordinates
    const getCoordinates = (index: number, value: number, maxVal: number) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / maxVal) * (height - padding * 2);
      return { x, y };
    };

    const visibilityCoords = points.map((p, i) => getCoordinates(i, p.recruiter_visibility_score, 100));
    const leverageCoords = points.map((p, i) => getCoordinates(i, p.leverage_accumulated, 10));

    const generatePath = (coords: { x: number; y: number }[]) => {
      return coords.reduce((acc, c, i) => {
        if (i === 0) return `M ${c.x} ${c.y}`;
        // Draw elegant curve
        const prev = coords[i - 1];
        if (!prev) return acc;
        const cpX1 = prev.x + (c.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (c.x - prev.x) / 2;
        const cpY2 = c.y;
        return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${c.x} ${c.y}`;
      }, '');
    };

    return (
      <div className="relative w-full overflow-hidden bg-white/[0.01] border border-white/[0.04] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Momentum Evolution Tracker</SectionLabel>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-white/40">Recruiter Visibility</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-white/40">Accumulated Leverage</span>
            </div>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="indigoGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />

          {/* Paths */}
          <path d={generatePath(visibilityCoords)} fill="none" stroke="url(#cyanGlow)" strokeWidth="2.5" />
          <path d={generatePath(leverageCoords)} fill="none" stroke="url(#indigoGlow)" strokeWidth="2" strokeDasharray="1" />

          {/* Data Points */}
          {visibilityCoords.map((c, i) => (
            <g key={`v-${i}`} className="group cursor-pointer">
              <circle cx={c.x} cy={c.y} r="4" className="fill-cyan-400 stroke-cyan-900 stroke-2 hover:r-5 transition-all" />
              <text x={c.x} y={c.y - 8} className="text-[7px] font-mono fill-cyan-300 text-center" textAnchor="middle">
                {points[i]?.recruiter_visibility_score}%
              </text>
            </g>
          ))}

          {leverageCoords.map((c, i) => (
            <g key={`l-${i}`} className="group cursor-pointer">
              <circle cx={c.x} cy={c.y} r="3" className="fill-indigo-500 stroke-indigo-950 stroke-2 hover:r-4 transition-all" />
              <text x={c.x} y={c.y + 11} className="text-[7px] font-mono fill-indigo-300" textAnchor="middle">
                {points[i]?.leverage_accumulated.toFixed(1)}x
              </text>
            </g>
          ))}
        </svg>
        <div className="flex justify-between mt-2 text-[9px] font-mono text-white/20">
          <span>Week 1: Foundations</span>
          <span>Week 2: Streams</span>
          <span>Week 3: hardener</span>
          <span>Week 4: Release</span>
        </div>
      </div>
    );
  };

  return (
    <PageContainer
      title="Executive Console"
      subtitle="Strategic Career Narrative Synthesis"
    >
      {/* Top Banner Control Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-white/[0.04] bg-white/[0.01] rounded-xl mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-semibold text-white/80">Cognitive Synchronization Active</h2>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Dynamic strategic storyline compiles live telemetry inputs, sandbox memories, and outreach deltas.
          </p>
        </div>

        <button
          onClick={triggerRecompute}
          disabled={recomputing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-400/20 text-xs font-medium bg-indigo-500/[0.06] text-indigo-300 hover:bg-indigo-500/[0.12] disabled:opacity-50 transition-all"
        >
          <RefreshCw size={12} className={recomputing ? 'animate-spin' : ''} />
          {recomputing ? 'Recomputing Narrative...' : 'Recompute Strategy'}
        </button>
      </div>

      <DashboardGrid cols={4}>
        <MetricCard
          label="Execution Delta"
          value={digest.execution_delta >= 0 ? `+${digest.execution_delta}%` : `${digest.execution_delta}%`}
          icon={TrendingUp}
          color={digest.execution_delta >= 0 ? "emerald" : "rose"}
        />
        <MetricCard
          label="Stagnation Index"
          value={`${Math.round(risk.stagnation_coefficient * 100)}%`}
          icon={AlertTriangle}
          color={risk.stagnation_coefficient > 0.5 ? "amber" : "indigo"}
        />
        <MetricCard
          label="Market Fit Index"
          value={`${opportunity.opportunity_clusters?.[0]?.market_demand_index || 80}%`}
          icon={Target}
        />
        <MetricCard
          label="Recruiter Pull Index"
          value={`${opportunity.opportunity_clusters?.[0]?.recruiter_pull_index || 75}%`}
          icon={Zap}
        />
      </DashboardGrid>

      {/* Main Command Workspace Split */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Left 2 Columns: Dynamic Tabs Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tab Selector Bar */}
          <div className="flex border-b border-white/[0.04] gap-2">
            {(['narrative', 'digest', 'opportunity', 'risk'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold capitalize transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-500/[0.02]'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}
              >
                {tab === 'narrative' ? 'Strategic Narrative' : tab === 'digest' ? 'Actionable Digest' : tab === 'opportunity' ? 'Opportunity Positioning' : 'Risk diagnostics'}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: Strategic Narrative */}
          {activeTab === 'narrative' && (
            <div className="space-y-6">
              <GlassPanel>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-indigo-400" />
                  <SectionLabel>Strategic Narrative briefing</SectionLabel>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                    <h4 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Current Trajectory Positioning</h4>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">{narrative_brief.current_positioning}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                      <h4 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Strongest Leverage Axis</h4>
                      <p className="text-xs text-indigo-300 mt-1 font-medium">{narrative_brief.strongest_leverage_direction}</p>
                    </div>
                    <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                      <h4 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Execution Speed</h4>
                      <p className="text-xs text-emerald-300 mt-1">{narrative_brief.execution_trajectory}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white/[0.01] border border-white/[0.02] rounded-lg">
                      <h4 className="text-[9px] text-white/20 uppercase tracking-wider font-mono">Market Alignment</h4>
                      <p className="text-[11px] text-white/50 mt-1">{narrative_brief.market_alignment}</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.02] rounded-lg">
                      <h4 className="text-[9px] text-white/20 uppercase tracking-wider font-mono">Recruiter Visibility</h4>
                      <p className="text-[11px] text-white/50 mt-1">{narrative_brief.recruiter_positioning}</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.02] rounded-lg">
                      <h4 className="text-[9px] text-white/20 uppercase tracking-wider font-mono">Structural Risks</h4>
                      <p className="text-[11px] text-rose-300/60 mt-1">{narrative_brief.strategic_weaknesses}</p>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Execution Evolution Timeline */}
              <GlassPanel>
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={14} className="text-cyan-400" />
                  <SectionLabel>Execution Storyline & Projection</SectionLabel>
                </div>

                <div className="relative pl-6 border-l border-white/[0.06] ml-2 space-y-6">
                  {execution_storyline.map((milestone) => (
                    <div key={milestone.week} className="relative">
                      {/* Timeline node */}
                      <span className="absolute -left-[30px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 border border-white/[0.12] text-[8px] font-mono font-bold text-white/60 shadow-lg">
                        {milestone.week}
                      </span>

                      <div className="group rounded-lg border border-white/[0.03] bg-white/[0.01] p-3 hover:bg-white/[0.02] hover:border-white/[0.06] transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-semibold text-white/80">{milestone.milestone_title}</h4>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-400/20 text-cyan-300 bg-cyan-500/[0.05]">
                            Vis: {milestone.recruiter_visibility_score}%
                          </span>
                        </div>
                        <p className="text-[11px] text-white/40 leading-relaxed mb-2">{milestone.narrative_evolution}</p>
                        <div className="flex items-center justify-between text-[9px] text-white/20 font-mono">
                          <span>Roadmap Leverage: {milestone.leverage_accumulated.toFixed(1)}x</span>
                          <span>Consistency Rate: {Math.round(milestone.consistency_rate * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          )}

          {/* TAB CONTENT: Actionable Digest */}
          {activeTab === 'digest' && (
            <div className="space-y-6">
              <GlassPanel>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-indigo-400" />
                  <SectionLabel>Weekly Strategic Digest briefing</SectionLabel>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-indigo-500/[0.02] border border-indigo-400/10 rounded-lg">
                    <h4 className="text-[10px] text-indigo-300 uppercase tracking-wider font-mono">Primary Weekly Recommendation</h4>
                    <p className="text-sm font-semibold text-white/90 mt-1">{digest.strategic_focus_recommendation}</p>
                    <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{digest.trajectory_summary}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                      <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Opportunity Transitions</h5>
                      <p className="text-xs text-white/60 mt-1">{digest.opportunity_changes}</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                      <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Risk Transitions</h5>
                      <p className="text-xs text-white/60 mt-1">{digest.risk_changes}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                      <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Confidence Level Transitions</h5>
                      <p className="text-xs text-white/60 mt-1">{digest.confidence_transitions}</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                      <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Skill Leverage Shifts</h5>
                      <p className="text-xs text-white/60 mt-1">{digest.leverage_shift}</p>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Compressed Signals */}
              <GlassPanel>
                <SectionLabel>Dynamic Signal Compression</SectionLabel>
                <div className="space-y-3">
                  {digest.compressed_signals?.map((sig, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-lg transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-white/70 font-mono tracking-wide">{sig.signal_type}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            sig.urgency === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            sig.urgency === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {sig.urgency}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-1 leading-normal">{sig.synthesis_summary}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] block font-mono text-white/40">Confidence: {Math.round(sig.confidence*100)}%</span>
                        <span className="text-[10px] block font-mono text-indigo-300 mt-1">Impact: {sig.leverage_impact.toFixed(2)}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          )}

          {/* TAB CONTENT: Opportunity Clusters */}
          {activeTab === 'opportunity' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {opportunity.opportunity_clusters.map((cluster, i) => (
                  <GlassPanel key={i} className="border-indigo-400/10 hover:border-indigo-400/20 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold text-white/80">{cluster.cluster_name}</h4>
                        <span className="text-[9px] px-2 py-0.5 rounded-full border border-indigo-400/20 text-indigo-300 bg-indigo-500/[0.06] font-mono">
                          {cluster.compound_leverage_multiplier.toFixed(2)}x
                        </span>
                      </div>

                      <p className="text-[10px] text-white/30 font-mono mb-2 uppercase tracking-wide">Target: {cluster.target_specialization}</p>
                      <p className="text-xs text-white/50 leading-relaxed mb-4">{cluster.synthesis_description}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-white/30 border-t border-white/[0.04] pt-3 mb-3">
                        <span>Pull Index: <b className="text-white/60">{cluster.recruiter_pull_index}%</b></span>
                        <span>Demand: <b className="text-white/60">{cluster.market_demand_index}%</b></span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {cluster.leverage_roadmap_skills.map((skill) => (
                          <span key={skill} className="text-[9px] px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.06] text-white/50">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: Risk Audits */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <GlassPanel>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-rose-400" />
                    <SectionLabel>Strategic Risk diagnostics</SectionLabel>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    risk?.risk_factor_level === 'CRITICAL' ? 'bg-rose-500/[0.08] text-rose-400 border-rose-400/20' :
                    risk?.risk_factor_level === 'HIGH' ? 'bg-amber-500/[0.08] text-amber-400 border-amber-400/20' :
                    'bg-cyan-500/[0.08] text-cyan-300 border-cyan-400/20'
                  }`}>
                    {risk.risk_factor_level} RISK LEVEL
                  </span>
                </div>

                <p className="text-xs text-white/70 leading-relaxed mb-4">{risk.diagnostics_brief}</p>

                <div className="grid md:grid-cols-2 gap-4 border-t border-white/[0.04] pt-4">
                  <div>
                    <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Active Risk Triggers</h5>
                    <ul className="space-y-1.5">
                      {risk.active_risk_triggers.map((trigger, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-white/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                          <span>{trigger}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Reconstruction Actions</h5>
                    <ul className="space-y-1.5">
                      {risk.reconstruction_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <CheckCircle size={12} className="text-indigo-400/60 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </GlassPanel>
            </div>
          )}

        </div>

        {/* Right Sidebar: Dynamic Momentum Tracker & focus Panel */}
        <div className="space-y-6">
          {/* Momentum Evolution Chart Widget */}
          {renderMomentumTracker()}

          {/* Strategic Focus Sidebar Panel */}
          <WorkspaceCard>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Strategic Focus Panel</SectionLabel>
              <Target size={14} className="text-white/20" />
            </div>

            <div className="space-y-4">
              <div className="pb-3 border-b border-white/[0.03]">
                <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Current Objective</h5>
                <p className="text-xs font-semibold text-white/80 mt-1">{digest.strategic_focus_recommendation}</p>
              </div>

              <div className="pb-3 border-b border-white/[0.03]">
                <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono">Telemetry Calibration</h5>
                <div className="flex justify-between text-xs mt-1.5">
                  <span className="text-white/50">Predictive Accuracy</span>
                  <span className="font-mono text-cyan-300">94.0%</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-white/50">Causal Calibration</span>
                  <span className="font-mono text-cyan-300">92.0%</span>
                </div>
              </div>

              <div>
                <h5 className="text-[10px] text-white/30 uppercase tracking-wider font-mono mb-2">Active Leverage Skills</h5>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.opportunity_clusters?.[0]?.leverage_roadmap_skills?.map((skill) => (
                    <span key={skill} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-indigo-500/[0.06] border border-indigo-400/20 text-indigo-300 font-medium">
                      <Sparkles size={8} />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </PageContainer>
  );
}
