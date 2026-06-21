'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader } from '@/components/ds';
import { opportunities as opportunitiesApi } from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Radar, ArrowDown, ArrowUp, HelpCircle } from 'lucide-react';
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

  // Hardened fields
  compensation?: string;
  recruiterPressure?: 'high' | 'medium' | 'low';
  hiringWindow?: string;
  stackCompatibility?: string;
  alignmentReasoning?: string;
  location?: string;
  url?: string;
  source?: string;
  posted_at?: string;
  status?: string;
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
  const [matchStatus, setMatchStatus] = useState<string | undefined>();
  const [matchMessage, setMatchMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const {
    simulationActive,
    opportunities: simOpportunities,
    hasStrategicProfile,
    activePersona
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    try {
      const { matches, gaps, radar, matchStatus: status, matchMessage: message } = await opportunitiesApi.getAll();
      setApiMatches(matches as Match[]);
      setApiGaps(gaps as Gap[]);
      setApiRadar(radar);
      setMatchStatus(status);
      setMatchMessage(message);
    } catch {
      /* Fail silently — page shows empty state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Opportunities Matcher"
          subtitle="Aligning real-world career vectors..."
        />
        <OpportunitiesSkeleton />
      </div>
    );
  }

  // Resolve active opportunities data
  const activeMatches: Match[] = simulationActive
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ? (simOpportunities as any[]).map((opp) => ({
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
        location: opp.location || 'Remote',
        url: opp.url || 'https://skillyn.com',
        source: opp.source || 'Simulation Ingestion',
        posted_at: opp.posted_at || new Date().toISOString()
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

  const matchesToRender = activeMatches;
  const gapsToRender = activeGaps;
  const radarToRender = activeRadar;

  const showEmptyState = !simulationActive && !hasStrategicProfile;
  const showPendingState = !simulationActive && hasStrategicProfile && activeMatches.length === 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Opportunities Matcher"
        subtitle={simulationActive ? "Real-world career acceleration (Simulation Sandbox)" : "Real-world career acceleration"}
      />

      {showEmptyState ? (
        <div className="p-8 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-center max-w-2xl mx-auto my-12 space-y-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto text-purple-400">
            <Radar size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Find Target Career Opportunities</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We match you with real-world jobs and pinpoint missing skills based on your profile. Upload your resume or configure your career parameters to initialize the matching process.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href="/resumes"
              className="rounded-lg px-4 py-2 bg-purple-500 hover:bg-purple-600 text-black text-xs font-bold transition-colors"
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
      ) : showPendingState ? (
        <div className="p-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center max-w-2xl mx-auto my-12 space-y-4">
          <Radar size={24} className="mx-auto text-amber-400" />
          <h3 className="text-base font-bold text-white">Matches are being prepared</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {matchMessage || 'Your profile is calibrated. Opportunity matching will appear after resume processing or profile update completes.'}
          </p>
        </div>
      ) : (
        <>
      {matchesToRender.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <div className="flex items-center justify-between mb-3 border-b border-white/[0.04] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Matching Opportunities</h3>
            <span className="text-[8px] text-white/20 font-mono tracking-wider">
              {simulationActive ? 'SIMULATION' : matchStatus === 'ready' ? 'LIVE MATCHES' : 'DYNAMIC MATCHER ACTIVE'}
            </span>
          </div>
          <div className="space-y-4 mt-3">
            {matchesToRender.map((m, i) => (
              <InteractiveCard key={i} className="p-4.5 relative overflow-hidden bg-white/[0.005]">
                <div className="absolute top-0 right-0 h-full w-[2.5px] bg-gradient-to-b from-blue-500/20 to-transparent" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white/95">{m.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <span>{m.company}</span>
                      <span>•</span>
                      <span>{m.location || 'Remote'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                      {m.compensation || m.estimated_career_impact}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400">
                      {Math.round(m.alignment_score * 100)}% match
                    </span>
                  </div>
                </div>

                {/* Why you match */}
                {m.alignmentReasoning && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-950/20 border border-blue-500/10 text-xs text-slate-300 leading-relaxed font-sans">
                    <span className="font-semibold text-blue-400 flex items-center gap-1 mb-1">
                      <HelpCircle size={12} /> Why you match this role:
                    </span>
                    {m.alignmentReasoning}
                  </div>
                )}

                {/* Source, Date & Apply Link CTA */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.04] text-[11px]">
                  <div className="flex items-center gap-2.5 text-slate-500 font-mono">
                    {m.status === 'LIVE' || (m.source && !['Vercel Seed', 'Stripe Seed', 'HashiCorp Seed', 'Anthropic Seed', 'Supabase Seed'].includes(m.source)) ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[9px] uppercase tracking-wider font-bold text-emerald-400">
                        LIVE MATCH
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[9px] uppercase tracking-wider font-bold text-amber-400">
                        DEMO DATA
                      </span>
                    )}
                    {m.source && (
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] text-[9px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                        {m.source}
                      </span>
                    )}
                    {m.posted_at && (
                      <span className="text-[10px]">
                        Posted: {new Date(m.posted_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded transition-colors"
                    >
                      Apply Now →
                    </a>
                  ) : (
                    <span className="text-slate-600 italic">No direct link</span>
                  )}
                </div>
              </InteractiveCard>
            ))}
          </div>
        </Panel>
      )}

      {matchesToRender.length === 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015] p-8 text-center max-w-lg mx-auto rounded-2xl">
          <Radar size={40} className="text-slate-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-sm font-semibold text-white mb-2">No Relevant Opportunities Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            No relevant opportunities found today. We&apos;ll continue monitoring the market and notify you when new matches appear.
          </p>
          <button
            onClick={fetchData}
            className="rounded px-4 py-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold transition-all"
          >
            Refresh Opportunities
          </button>
        </Panel>
      )}

      {/* Gap-to-Opportunity */}
      {gapsToRender.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Target Career Readiness" />
          <div className="mt-3 space-y-3">
            {gapsToRender.map((g, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white/70">{g.target_role}</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {g.missing_skills.length > 0 ? (
                      g.missing_skills.map(s => <span key={s} className="text-[10px] bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded text-white/40">{s}</span>)
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-mono">ALL SKILL REQUIREMENTS MET</span>
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
              <SectionHeader title="Skill Value Assessment" />
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
                      <span className="text-[10px] text-white/25 font-mono">Potential Impact: +{Math.round(s.roi * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          <Panel className="border-white/[0.04] bg-white/[0.015]">
            <SectionHeader title="Salary Progression Paths" />
            <div className="mt-3 space-y-3">
              {radarToRender.salary_growth_paths.map((p, i) => (
                <p key={i} className="text-xs text-white/40 leading-relaxed font-medium">• {p}</p>
              ))}
              {radarToRender.emerging_domains.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/[0.03]">
                  <p className="text-[9px] text-white/20 uppercase tracking-wider font-mono mb-2">Emerging industry sectors:</p>
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
        </>
      )}
    </div>
  );
}

function OpportunitiesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Matching Opportunities Panel Skeleton */}
      <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.015] space-y-4">
        <div className="h-5 w-40 bg-white/10 rounded mb-2" />
        {[1, 2].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-white/[0.04] bg-white/[0.005] space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-white/20 rounded" />
                <div className="h-3.5 w-32 bg-white/10 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-white/10 rounded" />
                <div className="h-5 w-16 bg-white/10 rounded" />
              </div>
            </div>
            <div className="h-10 w-full bg-white/[0.02] rounded" />
          </div>
        ))}
      </div>

      {/* Target Career Readiness Panel Skeleton */}
      <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.015] space-y-4">
        <div className="h-5 w-44 bg-white/10 rounded mb-2" />
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-white/20 rounded" />
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4.5 w-16 bg-white/10 rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4.5 w-20 bg-white/20 rounded" />
              <div className="h-3 w-12 bg-white/10 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Radar 2-Column Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.015] space-y-4">
          <div className="h-5 w-36 bg-white/10 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="h-3.5 w-24 bg-white/20 rounded" />
              <div className="h-3.5 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.015] space-y-4">
          <div className="h-5 w-32 bg-white/10 rounded" />
          <div className="h-3.5 w-full bg-white/[0.04] rounded" />
          <div className="h-3.5 w-5/6 bg-white/[0.04] rounded" />
        </div>
      </div>
    </div>
  );
}
