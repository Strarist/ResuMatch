'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Radar, ArrowDown, ArrowUp } from 'lucide-react';
import InteractiveCard from '@/components/effects/InteractiveCard';

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
  const { simulationActive, opportunities: simOpportunities } = useLivingSystem();

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
    ? simOpportunities.map(opp => ({
        type: 'full_time',
        title: opp.title,
        company: opp.company,
        alignment_score: opp.alignmentScore,
        confidence: opp.confidence,
        estimated_career_impact: opp.urgency === 'high' ? 'High Impact ($220k+)' : 'Medium Impact ($190k+)',
        matching_signals: ['Distributed caching proof validated', 'Systems engineering credentials verified'],
        missing_requirements: opp.missingRequirements,
        proof_gaps: opp.proofGaps,
        urgency: opp.urgency,
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
        emerging_domains: ['GPU compute optimization', 'Consensus databases', 'LLM edge routers'],
        high_roi_skills: [
          { skill: 'CUDA Kernel Tuning', roi: 0.94, trend: 'rising' },
          { skill: 'Raft consensus protocols', roi: 0.88, trend: 'rising' },
          { skill: 'Rust compiler extensions', roi: 0.82, trend: 'stable' },
          { skill: 'WASM edge hosting design', roi: 0.74, trend: 'cooling' },
        ],
        salary_growth_paths: [
          'AI Platform Architect (Average: $210,000 base + equity)',
          'Staff Infrastructure Systems Engineer (Average: $195,000 base)',
        ],
        underutilized_strengths: ['High-throughput message broker architecture', 'Compiler diagnostic analysis'],
      }
    : apiRadar;

  const isDormant = !simulationActive && apiMatches.length === 0;

  const fallbackMatches: Match[] = [
    {
      type: 'full_time',
      title: 'Principal AI Platform Architect (Target)',
      company: 'Vercel (Standby)',
      alignment_score: 0.72,
      confidence: 0.65,
      estimated_career_impact: '$220k - $270k',
      matching_signals: ['System standby mode'],
      missing_requirements: ['CUDA Kernel Optimization', 'vLLM Serving Orchestration'],
      proof_gaps: ['WASM optimization proof'],
      urgency: 'low',
    },
    {
      type: 'full_time',
      title: 'Distributed Infrastructure Lead (Target)',
      company: 'Stripe (Standby)',
      alignment_score: 0.68,
      confidence: 0.60,
      estimated_career_impact: '$195k - $240k',
      matching_signals: ['System standby mode'],
      missing_requirements: ['Raft consensus protocols'],
      proof_gaps: ['Distributed transactional ledger validation'],
      urgency: 'low',
    }
  ];

  const fallbackGaps: Gap[] = [
    {
      target_role: 'Principal AI Platform Architect (Target)',
      readiness_percentage: 72,
      missing_skills: ['CUDA Kernel Optimization', 'vLLM Serving Orchestration'],
      missing_proof: ['WASM optimization proof'],
      estimated_completion_time: 'Awaiting Ingestion',
    },
    {
      target_role: 'Distributed Infrastructure Lead (Target)',
      readiness_percentage: 68,
      missing_skills: ['Raft consensus protocols'],
      missing_proof: ['Distributed transactional ledger validation'],
      estimated_completion_time: 'Awaiting Ingestion',
    }
  ];

  const fallbackRadar: MarketRadar = {
    emerging_domains: ['GPU compute optimization', 'Consensus databases', 'LLM edge routers'],
    high_roi_skills: [
      { skill: 'CUDA Kernel Tuning', roi: 0.94, trend: 'rising' },
      { skill: 'Raft consensus protocols', roi: 0.88, trend: 'rising' },
      { skill: 'Rust compiler extensions', roi: 0.82, trend: 'stable' },
    ],
    salary_growth_paths: [
      'AI Platform Architect (Average: $210,000 base + equity)',
      'Staff Infrastructure Systems Engineer (Average: $195,000 base)',
    ],
    underutilized_strengths: ['High-throughput message broker architecture', 'Compiler diagnostic analysis'],
  };

  const matchesToRender = isDormant ? fallbackMatches : activeMatches;
  const gapsToRender = isDormant ? fallbackGaps : activeGaps;
  const radarToRender = isDormant ? fallbackRadar : activeRadar;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Opportunities"
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
              Awaiting profile calibration. Upload resume portfolio artifacts on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</a>{' '}
              view or toggle Simulation Mode in the sidebar footer to run live opportunity alignment checks.
            </p>
          </div>
        </div>
      )}

      {/* Top Matches */}
      {matchesToRender.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Top Opportunity Matches" />
            <span className="text-[8px] text-white/20 font-mono tracking-wider">
              {isDormant ? 'CALIBRATION STANDBY' : 'LIVE MATCHER'}
            </span>
          </div>
          <div className="space-y-3 mt-3">
            {matchesToRender.map((m, i) => (
              <InteractiveCard key={i} className="p-3.5 relative overflow-hidden bg-white/[0.005]">
                <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-blue-500/20 to-transparent" />
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-semibold text-white/80">{m.title}</span>
                    <span className="text-xs text-white/40 ml-2">@ {m.company}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusBadge status={m.urgency === 'high' ? 'error' : 'warning'}>{m.urgency.toUpperCase()}</StatusBadge>
                    <StatusBadge status="neutral">{m.type.replace(/_/g, ' ')}</StatusBadge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/35 mt-1">
                  <span>Alignment Index: <span className="text-white/60 font-semibold font-mono">{Math.round(m.alignment_score * 100)}%</span></span>
                  <span>Signal Confidence: <span className="text-white/60 font-mono">{Math.round(m.confidence * 100)}%</span></span>
                  <span>Estimated Comp: <span className="text-blue-300 font-mono">{m.estimated_career_impact}</span></span>
                </div>

                {m.missing_requirements.length > 0 ? (
                  <p className="text-xs text-white/25 mt-2.5 flex items-center gap-1.5">
                    <span className="text-white/10 uppercase text-[9px] font-mono">Missing:</span>
                    {m.missing_requirements.join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400/80 mt-2.5 font-semibold">✓ Core skill vectors matching 100%.</p>
                )}

                {m.proof_gaps.length > 0 && (
                  <p className="text-xs text-amber-400/50 mt-1 flex items-center gap-1.5">
                    <span className="text-white/10 uppercase text-[9px] font-mono">Proof Gap:</span>
                    {m.proof_gaps.join(', ')}
                  </p>
                )}
              </InteractiveCard>
            ))}
          </div>
        </Panel>
      )}

      {/* Gap-to-Opportunity */}
      {gapsToRender.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Competency Gap Analysis" />
          <div className="mt-3 space-y-3">
            {gapsToRender.map((g, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white/70">{g.target_role}</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {g.missing_skills.length > 0 ? (
                      g.missing_skills.map(s => <span key={s} className="text-[10px] bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded text-white/40">{s}</span>)
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono">NO SKILL GAPS DETECTED</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-4 sm:flex-col sm:items-end">
                  <div>
                    <p className="text-sm font-bold text-accent font-mono transition-all duration-700">{g.readiness_percentage}%</p>
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
                      <span className="text-[10px] text-white/25 font-mono">ROI: {Math.round(s.roi * 100)}%</span>
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
