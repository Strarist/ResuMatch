'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Radar, ArrowDown, ArrowUp, Clock, ShieldCheck, HelpCircle } from 'lucide-react';
import InteractiveCard from '@/components/effects/InteractiveCard';
import { HardenedOpportunityMatch } from '@/data/baseline-profiles';

interface Match {
  type: string;
  title: string;
  company: string;
  alignment_score: number;
  confidence: number;
  estimated_career_impact: string;
  matching_signals: string[];
  missing_requirements: string[];
  proof_gaps: string[];
  urgency: string;

  // Hardened fields
  compensation?: string;
  recruiterPressure?: 'high' | 'medium' | 'low';
  hiringWindow?: string;
  stackCompatibility?: string;
  alignmentReasoning?: string;
}

interface Gap {
  target_role: string;
  readiness_percentage: number;
  missing_skills: string[];
  missing_proof: string[];
  estimated_completion_time: string;
}

interface MarketRadar {
  emerging_domains: string[];
  high_roi_skills: { skill: string; roi: number; trend: string }[];
  salary_growth_paths: string[];
  underutilized_strengths: string[];
}

export default function OpportunitiesPage() {
  const [apiMatches, setApiMatches] = useState<Match[]>([]);
  const [apiGaps, setApiGaps] = useState<Gap[]>([]);
  const [apiRadar, setApiRadar] = useState<MarketRadar | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    simulationActive,
    opportunities: simOpportunities,
    lifecycleStage,
    activePersona
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const [m, g, r] = await Promise.allSettled([
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/matches`, { headers: h }).then(res => res.ok ? res.json() : null),
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/gaps`, { headers: h }).then(res => res.ok ? res.json() : null),
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/radar`, { headers: h }).then(res => res.ok ? res.json() : null),
    ]);
    if (m.status === 'fulfilled' && m.value) setApiMatches(m.value.matches || []);
    if (g.status === 'fulfilled' && g.value) setApiGaps(g.value.gaps || []);
    if (r.status === 'fulfilled' && r.value) setApiRadar(r.value);
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

  // Resolve active opportunities data
  const activeMatches: Match[] = simulationActive
    ? (simOpportunities as HardenedOpportunityMatch[]).map((opp) => ({
        type: opp.type || 'full_time',
        title: opp.title,
        company: opp.company,
        alignment_score: opp.alignmentScore,
        confidence: opp.confidence,
        estimated_career_impact: opp.urgency === 'high' ? 'High Impact ($220k+)' : 'Medium Impact ($190k+)',
        matching_signals: ['Specialization credentials match key templates', 'Target stack core is fully verified'],
        missing_requirements: opp.missingRequirements,
        proof_gaps: opp.proofGaps,
        urgency: opp.urgency,

        compensation: opp.compensation,
        recruiterPressure: opp.recruiterPressure,
        hiringWindow: opp.hiringWindow,
        stackCompatibility: opp.stackCompatibility,
        alignmentReasoning: opp.alignmentReasoning,
      }))
    : apiMatches;

  const activeGaps: Gap[] = simulationActive
    ? simOpportunities.map(opp => ({
        target_role: opp.title,
        readiness_percentage: Math.round(opp.alignmentScore * 100),
        missing_skills: opp.missingRequirements,
        missing_proof: opp.proofGaps,
        estimated_completion_time: opp.missingRequirements.length > 0 ? `${opp.missingRequirements.length * 4}w target` : 'Fully Ready',
      }))
    : apiGaps;

  const activeRadar: MarketRadar | null = simulationActive
    ? {
        emerging_domains: [activePersona.marketIntel.title, 'System design metrics scaling', 'Secure credential verification'],
        high_roi_skills: activePersona.roadmap.map(node => ({
          skill: node.skill,
          roi: node.impactEstimate / 100,
          trend: node.priority === 'high' ? 'rising' : 'stable'
        })),
        salary_growth_paths: [
          `${activePersona.targetRole} (Average: ${activePersona.marketIntel.salaryRange} base + incentives)`,
        ],
        underutilized_strengths: activePersona.strongestSkills.slice(0, 2),
      }
    : apiRadar;

  const isDormant = lifecycleStage === 1;

  const fallbackMatches: Match[] = [
    {
      type: 'full_time',
      title: 'Staff Full Stack Developer (Target)',
      company: 'Vercel (Standby)',
      alignment_score: 0.72,
      confidence: 0.65,
      estimated_career_impact: '$190k - $240k',
      matching_signals: ['System standby mode'],
      missing_requirements: ['GraphQL Federation', 'Distributed Caching (Redis)'],
      proof_gaps: ['WASM optimization proof'],
      urgency: 'low',
      compensation: '$190k - $240k',
      recruiterPressure: 'medium',
      hiringWindow: 'Calibration Standby',
      stackCompatibility: 'React, Next.js, GraphQL',
      alignmentReasoning: 'Opportunities engine is uncalibrated. Ingest resume portfolio artifacts to align target parameters.',
    },
    {
      type: 'full_time',
      title: 'Senior Site Reliability Engineer (Target)',
      company: 'Stripe (Standby)',
      alignment_score: 0.68,
      confidence: 0.60,
      estimated_career_impact: '$200k - $250k',
      matching_signals: ['System standby mode'],
      missing_requirements: ['Istio Service Mesh', 'Prometheus Tuning'],
      proof_gaps: ['Distributed transactional ledger validation'],
      urgency: 'low',
      compensation: '$200k - $250k',
      recruiterPressure: 'low',
      hiringWindow: 'Calibration Standby',
      stackCompatibility: 'AWS, Terraform, Kubernetes',
      alignmentReasoning: 'Awaiting portfolio ingestion to calculate causal stack matching indices.',
    }
  ];

  const fallbackGaps: Gap[] = [
    {
      target_role: 'Staff Full Stack Developer (Target)',
      readiness_percentage: 72,
      missing_skills: ['GraphQL Federation'],
      missing_proof: ['Production router setup proof'],
      estimated_completion_time: 'Awaiting Ingestion',
    },
    {
      target_role: 'Senior Site Reliability Engineer (Target)',
      readiness_percentage: 68,
      missing_skills: ['Istio Service Mesh'],
      missing_proof: ['mTLS setup logs'],
      estimated_completion_time: 'Awaiting Ingestion',
    }
  ];

  const fallbackRadar: MarketRadar = {
    emerging_domains: ['Cloud native platforms', 'Edge routing runtimes', 'Service meshes'],
    high_roi_skills: [
      { skill: 'GraphQL Federation', roi: 0.88, trend: 'rising' },
      { skill: 'Istio Service Mesh', roi: 0.92, trend: 'rising' },
    ],
    salary_growth_paths: [
      'Staff Full Stack Developer (Average: $190k - $240k base)',
      'Senior Site Reliability Engineer (Average: $200k - $250k base)',
    ],
    underutilized_strengths: ['Standard developer runtime config'],
  };

  const matchesToRender = isDormant ? fallbackMatches : activeMatches;
  const gapsToRender = isDormant ? fallbackGaps : activeGaps;
  const radarToRender = isDormant ? fallbackRadar : activeRadar;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Opportunities Matcher"
        subtitle={simulationActive ? "Real-world career acceleration (Simulation Sandbox)" : "Real-world career acceleration"}
      />

      {/* Dormant state banner */}
      {isDormant && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Radar size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Opportunities Engine in Standby Mode</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Your profile is currently uncalibrated. Ingest resume portfolio artifacts on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</a>{' '}
              view or select a baseline persona in the sidebar to initialize dynamic opportunity matches and recruiter signals.
            </p>
          </div>
        </div>
      )}

      {/* Top Matches */}
      {matchesToRender.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <div className="flex items-center justify-between mb-3 border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Top Career Opportunity Matches</h3>
            <span className="text-[8px] text-white/20 font-mono tracking-wider">
              {isDormant ? 'CALIBRATION STANDBY' : 'DYNAMIC MATCHER ACTIVE'}
            </span>
          </div>
          <div className="space-y-4 mt-3">
            {matchesToRender.map((m, i) => (
              <InteractiveCard key={i} className="p-4.5 relative overflow-hidden bg-white/[0.005]">
                <div className="absolute top-0 right-0 h-full w-[2.5px] bg-gradient-to-b from-blue-500/20 to-transparent" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white/95">{m.title}</h4>
                    <span className="text-xs text-slate-400 mt-0.5 block">@ {m.company}</span>
                  </div>

                  <div className="flex gap-2">
                    {m.compensation && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                        {m.compensation}
                      </span>
                    )}
                    {m.hiringWindow && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1">
                        <Clock size={10} /> {m.hiringWindow}
                      </span>
                    )}
                    {m.recruiterPressure && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                        m.recruiterPressure === 'high'
                          ? 'border-red-500/20 text-red-400 bg-red-500/[0.04]'
                          : 'border-amber-500/20 text-amber-400 bg-amber-500/[0.04]'
                      }`}>
                        Demand: {m.recruiterPressure}
                      </span>
                    )}
                    <StatusBadge status={m.urgency === 'high' ? 'error' : 'warning'}>{m.urgency.toUpperCase()}</StatusBadge>
                  </div>
                </div>

                {/* Compatibility stats */}
                <div className="flex items-center gap-4 text-xs text-white/35 mt-1 border-t border-white/[0.03] pt-2">
                  <span>Alignment Match: <span className="text-white/60 font-semibold font-mono">{Math.round(m.alignment_score * 100)}%</span></span>
                  <span>Screening Confidence: <span className="text-white/60 font-mono">{Math.round(m.confidence * 100)}%</span></span>
                  {m.stackCompatibility && (
                    <span className="truncate max-w-[250px] hidden md:inline">Required Stack: <span className="text-slate-400 font-mono text-[11px]">{m.stackCompatibility}</span></span>
                  )}
                </div>

                {/* WHY IS THIS RELEVANT TO ME? narrative card */}
                {m.alignmentReasoning && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-950/20 border border-blue-500/10 text-xs text-slate-300 leading-relaxed">
                    <span className="font-semibold text-blue-400 flex items-center gap-1 mb-1">
                      <HelpCircle size={12} /> Why this matches your trajectory:
                    </span>
                    {m.alignmentReasoning}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-white/[0.03]">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Outstanding Skill Gaps</span>
                    {m.missing_requirements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.missing_requirements.map(req => (
                          <span key={req} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono">
                            {req}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck size={11} /> 100% Skill coverage confirmed
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Recruiter Proof Gaps</span>
                    {m.proof_gaps.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.proof_gaps.map(gap => (
                          <span key={gap} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono truncate max-w-[200px]">
                            {gap}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck size={11} /> All required portfolio credentials validated
                      </span>
                    )}
                  </div>
                </div>

              </InteractiveCard>
            ))}
          </div>
        </Panel>
      )}

      {/* Gap-to-Opportunity */}
      {gapsToRender.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Target Profile Readiness Index" />
          <div className="mt-3 space-y-3">
            {gapsToRender.map((g, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white/70">{g.target_role}</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {g.missing_skills.length > 0 ? (
                      g.missing_skills.map(s => <span key={s} className="text-[10px] bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded text-white/40">{s}</span>)
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono">ALL TRAJECTORY VECTOR GAPS CURED</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-4 sm:flex-col sm:items-end">
                  <div>
                    <p className="text-sm font-bold text-accent font-mono transition-all duration-700">{g.readiness_percentage}% ready</p>
                    <p className="text-[10px] text-white/20 uppercase font-mono mt-0.5">{g.estimated_completion_time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Radar Section */}
      {radarToRender && (
        <div className="grid gap-4 sm:grid-cols-2">
          {radarToRender.high_roi_skills.length > 0 && (
            <Panel className="border-white/[0.04] bg-white/[0.015]">
              <SectionHeader title="High ROI Skills Tuning" />
              <div className="mt-3 space-y-2.5">
                {radarToRender.high_roi_skills.map(s => (
                  <div key={s.skill} className="flex items-center justify-between py-1.5 border-b border-white/[0.02] last:border-0">
                    <span className="text-xs text-white/60 capitalize font-medium">{s.skill}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px]">
                        {s.trend === 'rising' ? (
                          <span className="text-emerald-400 flex items-center font-mono uppercase"><ArrowUp size={10} /> Rising</span>
                        ) : s.trend === 'cooling' ? (
                          <span className="text-amber-500 flex items-center font-mono uppercase"><ArrowDown size={10} /> Cooling</span>
                        ) : (
                          <span className="text-white/30 flex items-center font-mono uppercase">Stable</span>
                        )}
                      </span>
                      <span className="text-[10px] text-white/25 font-mono">Value: +{Math.round(s.roi * 100)} ROI</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel className="border-white/[0.04] bg-white/[0.015]">
            <SectionHeader title="Salary & Compounding Paths" />
            <div className="mt-3 space-y-3">
              {radarToRender.salary_growth_paths.map((p, i) => (
                <p key={i} className="text-xs text-white/40 leading-relaxed font-medium">• {p}</p>
              ))}
              {radarToRender.emerging_domains.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/[0.03]">
                  <p className="text-[9px] text-white/20 uppercase tracking-wider font-mono mb-2">Emerging domains detected:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {radarToRender.emerging_domains.map(d => (
                      <span key={d} className="text-[10px] border border-blue-500/20 bg-blue-500/[0.04] text-blue-300 px-2 py-0.5 rounded capitalize">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
