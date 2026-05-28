'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import {
  PageContainer,
  DashboardGrid,
  MetricCard,
  GlassPanel,
  SectionLabel,
  WorkspaceCard,
  LoadingPulse,
} from '@/components/workspace';
import { StatusBadge } from '@/components/ds';
import {
  Brain,
  Target,
  Shield,
  Compass,
  Radar,
  Globe,
  Activity,
  FileText,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { StrategicStateBanner } from '@/components/dashboard/StrategicStateBanner';

// Mock types matching the APIs
interface Resume {
  id: string;
  filename: string;
  uploaded_at: string;
}

interface Summary {
  dominant_path: string;
  secondary_paths: string[];
  competitiveness: number;
  confidence: number;
  market_alignment: number;
  salary_range: { low: number; high: number };
  growth_potential: string;
  roadmap_momentum: number;
  focus_areas: string[];
  adjacent_roles: { role: string; readiness: number; gap_skills: string[] }[];
}

interface RecruiterProfile {
  hiring_confidence: number;
  production_readiness: number;
  technical_depth: number;
  specialization_strength: number;
  differentiation_score: number;
  portfolio_maturity: string;
  strongest_signals: string[];
  hiring_risks: string[];
  role_fit: { role: string; skill_readiness: number; proof_adjusted: number; missing: string[] }[];
}

interface Match {
  title: string;
  company: string;
  alignment_score: number;
  confidence: number;
  estimated_career_impact: string;
  urgency: string;
  missing_requirements: string[];
  proof_gaps: string[];
}

interface MarketRadar {
  emerging_domains: string[];
  high_roi_skills: { skill: string; roi: number; trend: string }[];
}

interface Explanation {
  id: string;
  affected_domain: string;
  reasoning_summary: string;
  impact_delta: string;
  confidence_score: string;
  created_at: string;
}

interface Recommendation {
  title: string;
  explanation: string;
  priority: string;
  confidence: number;
  estimated_impact: string;
}

export default function DashboardPage() {
  const {
    simulationActive,
    metrics,
    feed: simFeed,
    roadmap,
    opportunities: simOpportunities,
    recruiterProfile: simProfile,
  } = useLivingSystem();

  // Component states
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [radar, setRadar] = useState<MarketRadar | null>(null);
  const [feed, setFeed] = useState<Explanation[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified fetcher for live data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [rRes, sRes, pRes, mRes, fRes, recsRes, radRes] = await Promise.allSettled([
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/resumes`, { headers: h }).then(res => (res.ok ? res.json() : null)),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/summary`, { headers: h }).then(res => (res.ok ? res.json() : null)),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/portfolio/recruiter-profile`, { headers: h }).then(res => (res.ok ? res.json() : null)),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/matches`, { headers: h }).then(res => (res.ok ? res.json() : null)),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/explanations?limit=3`, { headers: h }).then(res => (res.ok ? res.json() : null)),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/recommendations`, { headers: h }).then(res => (res.ok ? res.json() : null)),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/radar`, { headers: h }).then(res => (res.ok ? res.json() : null)),
      ]);

      if (rRes.status === 'fulfilled' && rRes.value) {
        setResumes(rRes.value.resumes || rRes.value || []);
      }
      if (sRes.status === 'fulfilled' && sRes.value) {
        setSummary(sRes.value);
      }
      if (pRes.status === 'fulfilled' && pRes.value) {
        setRecruiterProfile(pRes.value);
      }
      if (mRes.status === 'fulfilled' && mRes.value) {
        setMatches(mRes.value.matches || mRes.value || []);
      }
      if (fRes.status === 'fulfilled' && fRes.value) {
        setFeed(fRes.value || []);
      }
      if (recsRes.status === 'fulfilled' && recsRes.value) {
        setRecommendations(recsRes.value.recommendations || recsRes.value || []);
      }
      if (radRes.status === 'fulfilled' && radRes.value) {
        setRadar(radRes.value);
      }
    } catch (err) {
      console.error('Failed to hydrate Mission Control Dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchDashboardData]);

  const isDormant = !simulationActive && resumes.length === 0;

  const fallbackSummary: Summary = {
    dominant_path: 'Cloud Systems Engineer (Standby)',
    secondary_paths: ['Fullstack Development', 'DevOps Engineering'],
    competitiveness: 0.45,
    confidence: 0.42,
    market_alignment: 0.40,
    salary_range: { low: 110000, high: 145000 },
    growth_potential: 'stable',
    roadmap_momentum: 0.35,
    focus_areas: ['Python', 'Kubernetes Orchestration', 'Distributed Caching (Redis)'],
    adjacent_roles: [
      { role: 'Kubernetes Systems Architect', readiness: 0.62, gap_skills: ['Operator design patterns'] },
      { role: 'Lead DevOps Engineer', readiness: 0.58, gap_skills: ['Advanced telemetry pipelines'] },
    ],
  };

  const fallbackProfile: RecruiterProfile = {
    hiring_confidence: 0.42,
    production_readiness: 0.38,
    technical_depth: 0.40,
    specialization_strength: 0.35,
    differentiation_score: 0.30,
    portfolio_maturity: 'dormant',
    strongest_signals: ['System standing by in dormant operational mode.'],
    hiring_risks: ['Awaiting portfolio artifacts to scan credentials.'],
    role_fit: [
      { role: 'Cloud Systems Engineer', skill_readiness: 0.68, proof_adjusted: 0.60, missing: ['Advanced distributed systems validation'] }
    ],
  };

  const fallbackMatches: Match[] = [
    {
      title: 'Principal AI Platform Architect (Target)',
      company: 'Vercel (Standby)',
      alignment_score: 0.72,
      confidence: 0.65,
      estimated_career_impact: '$220k - $270k',
      urgency: 'low',
      missing_requirements: ['CUDA Kernel Optimization', 'vLLM Serving Orchestration'],
      proof_gaps: ['WASM optimization proof'],
    },
    {
      title: 'Distributed Infrastructure Lead (Target)',
      company: 'Stripe (Standby)',
      alignment_score: 0.68,
      confidence: 0.60,
      estimated_career_impact: '$195k - $240k',
      urgency: 'low',
      missing_requirements: ['Raft consensus protocols'],
      proof_gaps: ['Distributed transactional ledger validation'],
    }
  ];

  const fallbackRadar: MarketRadar = {
    emerging_domains: ['GPU compute optimization', 'Consensus databases', 'LLM edge routers'],
    high_roi_skills: [
      { skill: 'CUDA Kernel Tuning', roi: 0.94, trend: 'rising' },
      { skill: 'Raft consensus protocols', roi: 0.88, trend: 'rising' },
    ],
  };

  const fallbackFeed: Explanation[] = [
    {
      id: 'f-dormant-init',
      affected_domain: 'system_calibration',
      reasoning_summary: 'Roadmap engine standing by. Ingest resume portfolio artifacts to calibrate custom skill vectors.',
      impact_delta: '0.0%',
      confidence_score: 'low',
      created_at: new Date().toISOString()
    }
  ];

  const fallbackRecs: Recommendation[] = [
    {
      title: 'Upload Portfolio / Resume',
      explanation: 'Ingest your engineering resume in the Resumes section to seed dynamic match scoring and activate custom skill paths.',
      priority: 'high',
      confidence: 1.0,
      estimated_impact: 'Calculates specific skill gaps for Stripe, Vercel, and other target organizations.'
    }
  ];

  // Resolve telemetry structures
  const activeResumes = simulationActive
    ? [{ id: 'sim-res', filename: 'Simulated_Core_Specialization.pdf', uploaded_at: new Date().toISOString() }]
    : resumes;

  const activeSummary: Summary | null = simulationActive
    ? {
        dominant_path: 'AI & Distributed Systems Platform Infrastructure',
        secondary_paths: ['High-Performance Computing', 'Rust Systems Design'],
        competitiveness: metrics.matchScore / 100,
        confidence: metrics.recruiterConfidence / 100,
        market_alignment: metrics.marketFit / 100,
        salary_range: { low: 185000, high: 265000 },
        growth_potential: 'exponential',
        roadmap_momentum: metrics.careerVelocity / 100,
        focus_areas: ['CUDA optimization', 'Consensus logic', 'LLM serving'],
        adjacent_roles: [
          { role: 'GPU Infrastructure Architect', readiness: 0.91, gap_skills: ['CUDA optimization tuning'] },
          { role: 'Distributed Consensus Developer', readiness: 0.88, gap_skills: ['Raft/Paxos consensus design'] },
        ],
      }
    : resumes.length > 0
    ? summary
    : fallbackSummary;

  const activeProfile: RecruiterProfile | null = simulationActive && simProfile
    ? {
        hiring_confidence: simProfile.hiringConfidence,
        production_readiness: simProfile.productionReadiness,
        technical_depth: simProfile.technicalDepth,
        specialization_strength: simProfile.specializationStrength,
        differentiation_score: simProfile.differentiationScore,
        portfolio_maturity: simProfile.portfolioMaturity,
        strongest_signals: simProfile.strongestSignals,
        hiring_risks: simProfile.hiringRisks,
        role_fit: simProfile.roleFit.map(f => ({
          role: f.role,
          skill_readiness: f.skillReadiness,
          proof_adjusted: f.proofAdjusted,
          missing: f.missing,
        })),
      }
    : resumes.length > 0
    ? recruiterProfile
    : fallbackProfile;

  const activeMatches: Match[] = simulationActive
    ? simOpportunities.map(opp => ({
        title: opp.title,
        company: opp.company,
        alignment_score: opp.alignmentScore,
        confidence: opp.confidence,
        estimated_career_impact: opp.urgency === 'high' ? 'High Impact ($220k+)' : 'Medium Impact ($190k+)',
        urgency: opp.urgency,
        missing_requirements: opp.missingRequirements,
        proof_gaps: opp.proofGaps,
      }))
    : resumes.length > 0
    ? matches
    : fallbackMatches;

  const activeRadar: MarketRadar | null = simulationActive
    ? {
        emerging_domains: ['GPU compute optimization', 'Consensus databases', 'LLM edge routers'],
        high_roi_skills: [
          { skill: 'CUDA Kernel Tuning', roi: 0.94, trend: 'rising' },
          { skill: 'Raft consensus protocols', roi: 0.88, trend: 'rising' },
        ],
      }
    : resumes.length > 0
    ? radar
    : fallbackRadar;

  const activeFeed: Explanation[] = simulationActive
    ? simFeed.slice(0, 3).map(item => ({
        id: item.id,
        affected_domain: item.eventType,
        reasoning_summary: item.message,
        impact_delta: item.urgency === 'high' ? '+4.5%' : '+1.2%',
        confidence_score: item.urgency || 'high',
        created_at: item.createdAt,
      }))
    : resumes.length > 0
    ? feed
    : fallbackFeed;

  const activeRecs: Recommendation[] = simulationActive
    ? roadmap.map(node => ({
        title: `Integrate ${node.skill}`,
        explanation: node.reason,
        priority: node.priority,
        confidence: node.impactEstimate,
        estimated_impact: `Estimated trajectory impact: +${Math.round(node.impactEstimate / 10)}% recruiter readiness matching key pipelines.`,
      }))
    : resumes.length > 0
    ? recommendations
    : fallbackRecs;

  if (loading) {
    return (
      <PageContainer title="Mission Control" subtitle="Consolidation Telemetry Loading...">
        <LoadingPulse rows={6} />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Mission Control"
      subtitle={simulationActive ? "Career Operating System (Simulation Sandbox)" : "Career Operating System"}
    >
      <div className="space-y-6">
        {/* Dormant state banner */}
        {isDormant && (
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Brain size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white mb-0.5">Dormant Baseline Telemetry Active</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                The career operating system has booted into a baseline state. To calculate personalized skill vectors, recruiter confidence, and opportunity alignments, upload your resume on the{' '}
                <Link href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</Link>{' '}
                page or toggle Simulation Mode in the sidebar footer.
              </p>
            </div>
          </div>
        )}

        {/* Strategic Vector Header */}
        <section className="animate-fade-in">
          <StrategicStateBanner />
        </section>

        {/* Layer 1 Overview: High-density Metrics */}
        {activeSummary && activeProfile && (
          <section className="animate-fade-in">
            <DashboardGrid cols={4}>
              <MetricCard
                label="Competitiveness"
                value={`${Math.round(activeSummary.competitiveness * 100)}%`}
                icon={Target}
              />
              <MetricCard
                label="Hiring Confidence"
                value={`${Math.round(activeProfile.hiring_confidence * 100)}%`}
                icon={Shield}
              />
              <MetricCard
                label="Market Alignment"
                value={`${Math.round(activeSummary.market_alignment * 100)}%`}
                icon={Globe}
              />
              <MetricCard
                label="Roadmap Momentum"
                value={`${Math.round(activeSummary.roadmap_momentum * 100)}%`}
                icon={TrendingUp}
              />
            </DashboardGrid>
          </section>
        )}

        {/* Layer 2: Main Opportunities & Strategic Action Plan */}
        <section className="grid lg:grid-cols-2 gap-6 animate-slide-in-bottom">
          {/* Opportunities matching panel */}
          <WorkspaceCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radar size={16} className="text-emerald-400" />
                <SectionLabel>Top Opportunity Matches</SectionLabel>
              </div>
              <Link
                href="/opportunities"
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                Expand <ChevronRight size={10} />
              </Link>
            </div>

            <div className="space-y-3.5">
              {activeMatches.slice(0, 3).map((match, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-white/95">{match.title}</span>
                      <span className="text-[10px] text-white/40 ml-1.5">@ {match.company}</span>
                    </div>
                    <StatusBadge status={match.urgency === 'high' ? 'error' : 'warning'}>
                      {match.urgency.toUpperCase()}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-white/30 mt-2 font-mono">
                    <span>Alignment: <strong className="text-white/60">{Math.round(match.alignment_score * 100)}%</strong></span>
                    <span>Confidence: <strong className="text-white/60">{Math.round(match.confidence * 100)}%</strong></span>
                    <span>Comp: <strong className="text-emerald-400/80">{match.estimated_career_impact}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </WorkspaceCard>

          {/* Strategic Recommendations */}
          <WorkspaceCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-blue-400" />
                <SectionLabel>Strategic recommendations</SectionLabel>
              </div>
              <Link
                href="/roadmap-v2"
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                Action Plan <ChevronRight size={10} />
              </Link>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {activeRecs.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold text-white/90">{rec.title}</h4>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono font-bold ${
                        rec.priority === 'high'
                          ? 'border-red-400/20 text-red-400 bg-red-500/[0.04]'
                          : 'border-amber-400/20 text-amber-400 bg-amber-500/[0.04]'
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{rec.explanation}</p>
                </div>
              ))}
            </div>
          </WorkspaceCard>
        </section>

        {/* Layer 3: Market Analysis & Credibility Profile */}
        <section className="grid lg:grid-cols-3 gap-6 animate-slide-in-bottom">
          {/* Market Intelligence Radar */}
          {activeRadar && (
            <GlassPanel className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={16} className="text-indigo-400" />
                <SectionLabel>Market Trends Radar</SectionLabel>
              </div>
              <div className="space-y-3 font-mono text-[10px] text-white/50">
                <div className="p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                  <span className="text-[8px] text-white/20 uppercase tracking-widest block mb-1.5">High ROI Skills</span>
                  {activeRadar.high_roi_skills.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-white/[0.02] last:border-0">
                      <span className="text-white/70 capitalize">{s.skill}</span>
                      <span className="text-emerald-400">ROI: {Math.round(s.roi * 100)}%</span>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                  <span className="text-[8px] text-white/20 uppercase tracking-widest block mb-1.5">Emerging Domains</span>
                  <div className="flex flex-wrap gap-1">
                    {activeRadar.emerging_domains.map((dom, idx) => (
                      <span key={idx} className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/[0.06] border border-indigo-500/20 text-indigo-300">
                        {dom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Recruiter Signals */}
          {activeProfile && (
            <GlassPanel className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <SectionLabel>Recruiter Credibility Profile</SectionLabel>
                </div>
                <span className="text-[9px] px-2 py-0.5 border border-emerald-500/20 rounded bg-emerald-500/[0.04] text-emerald-300 uppercase tracking-wider font-mono">
                  {activeProfile.portfolio_maturity.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Strongest Signals</h4>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {activeProfile.strongest_signals.slice(0, 3).map((sig, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-1.5 text-xs text-white/50 leading-relaxed font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 mt-1.5 flex-shrink-0" />
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Execution Risks</h4>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {activeProfile.hiring_risks.slice(0, 3).map((risk, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-1.5 text-xs text-white/50 leading-relaxed font-sans">
                        <AlertTriangle size={11} className="text-amber-400/60 mt-1 flex-shrink-0" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassPanel>
          )}
        </section>

        {/* Layer 4: System Event Mutation Feeds & portfolios */}
        <section className="grid lg:grid-cols-3 gap-6 animate-slide-in-bottom">
          {/* Active Portfolios Ingested */}
          <WorkspaceCard className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <SectionLabel>Active Portfolio Ingestion</SectionLabel>
              </div>
              <Link
                href="/resumes"
                className="text-[10px] text-slate-400 hover:text-slate-200 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                Manage <ChevronRight size={10} />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {activeResumes.length === 0 ? (
                <div className="p-3 border border-white/[0.04] bg-white/[0.005] rounded-lg text-center">
                  <p className="text-[11px] text-white/35 mb-2 font-mono">No portfolio artifacts ingested</p>
                  <Link
                    href="/resumes"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-[10px] font-bold transition-all"
                  >
                    <Plus size={11} /> Ingest Resume
                  </Link>
                </div>
              ) : (
                activeResumes.map((res, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-white/[0.01] border border-white/[0.03] text-xs"
                  >
                    <FileText size={14} className="text-emerald-400/60 flex-shrink-0" />
                    <span className="truncate flex-1 text-white/60">{res.filename}</span>
                  </div>
                ))
              )}
            </div>
          </WorkspaceCard>

          {/* Live Telemetry / Mutation Feeds */}
          <WorkspaceCard className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-rose-400" />
                <SectionLabel>System Telemetry Audit Feed</SectionLabel>
              </div>
              <span className="text-[8px] text-rose-400/50 font-mono tracking-widest uppercase">
                Synchronized
              </span>
            </div>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {activeFeed.length === 0 ? (
                <div className="text-xs text-white/30 italic py-6 text-center">No recent telemetry loops logged.</div>
              ) : (
                activeFeed.map((item, idx) => (
                  <div key={idx} className="relative pl-3.5 border-l border-white/[0.08] text-xs">
                    <span className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-slate-900 border border-blue-500" />
                    <div className="flex items-center justify-between font-medium mb-0.5">
                      <span className="capitalize text-white/70">{item.affected_domain.replace(/_/g, ' ')} Trace</span>
                      <span className="text-[10px] text-emerald-400 font-bold">{item.impact_delta}</span>
                    </div>
                    <p className="text-[11px] text-white/45 leading-relaxed">{item.reasoning_summary}</p>
                  </div>
                ))
              )}
            </div>
          </WorkspaceCard>
        </section>
      </div>
    </PageContainer>
  );
}
