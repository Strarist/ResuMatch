'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader } from '@/components/ds';
import {
  opportunities as opportunitiesApi,
  normalizeOpportunityMatch,
  formatMatchPercent,
  type OpportunityMatch,
} from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Radar, ArrowDown, ArrowUp, HelpCircle } from 'lucide-react';
import InteractiveCard from '@/components/effects/InteractiveCard';

type Match = OpportunityMatch;

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
  const [fetchError, setFetchError] = useState(false);

  const {
    simulationActive,
    opportunities: simOpportunities,
    hasStrategicProfile,
    activePersona,
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    setFetchError(false);
    try {
      const { matches, gaps, radar, matchStatus: status, matchMessage: message } = await opportunitiesApi.getAll();
      setApiMatches(
        matches.map((m) => normalizeOpportunityMatch(m as unknown as Record<string, unknown>))
      );
      setApiGaps(gaps as Gap[]);
      setApiRadar(radar);
      setMatchStatus(status);
      setMatchMessage(message);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setFetchError(true);
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
        <SectionHeader title="Opportunities Matcher" subtitle="Aligning real-world career vectors..." />
        <OpportunitiesSkeleton />
      </div>
    );
  }

  const activeMatches: Match[] = simulationActive
    ? simOpportunities.map((opp) =>
        normalizeOpportunityMatch({
          type: opp.type || 'full_time',
          title: opp.title,
          company: opp.company,
          alignmentScore: opp.alignmentScore,
          confidence: opp.confidence,
          estimated_career_impact: opp.urgency === 'high' ? 'High Impact ($220k+)' : 'Medium Impact ($190k+)',
          matching_signals: ['Specialization credentials match key templates', 'Target stack core is fully verified'],
          missingRequirements: opp.missingRequirements,
          proofGaps: opp.proofGaps,
          urgency: opp.urgency,
          compensation: opp.compensation,
          recruiterPressure: opp.recruiterPressure,
          hiringWindow: opp.hiringWindow,
          stackCompatibility: opp.stackCompatibility,
          alignmentReasoning: opp.alignmentReasoning,
          location: opp.location || 'Remote',
          url: opp.url || 'https://skillyn.com',
          source: opp.source || 'Simulation Ingestion',
          posted_at: opp.posted_at || new Date().toISOString(),
        })
      )
    : apiMatches;

  const activeGaps: Gap[] = simulationActive
    ? simOpportunities.map((opp) => ({
        target_role: opp.title,
        readiness_percentage: Math.round(opp.alignmentScore * 100),
        missing_skills: opp.missingRequirements,
        missing_proof: opp.proofGaps,
        estimated_completion_time:
          opp.missingRequirements.length > 0 ? `${opp.missingRequirements.length * 4}w target` : 'Fully Ready',
      }))
    : apiGaps;

  const activeRadar: MarketRadar | null = simulationActive
    ? {
        emerging_domains: [activePersona.marketIntel.title, 'System design metrics scaling', 'Secure credential verification'],
        high_roi_skills: activePersona.roadmap.map((node) => ({
          skill: node.skill,
          roi: node.impactEstimate / 100,
          trend: node.priority === 'high' ? 'rising' : 'stable',
        })),
        salary_growth_paths: [
          `${activePersona.targetRole} (Average: ${activePersona.marketIntel.salaryRange} base + incentives)`,
        ],
        underutilized_strengths: activePersona.strongestSkills.slice(0, 2),
      }
    : apiRadar;

  const showEmptyState = !simulationActive && !hasStrategicProfile;
  const showPendingState = !simulationActive && hasStrategicProfile && activeMatches.length === 0;

  const matchReasoning = (m: Match) => m.alignmentReasoning || m.alignment_reasoning;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Opportunities Matcher"
        subtitle={
          simulationActive ? 'Real-world career acceleration (Simulation Sandbox)' : 'Real-world career acceleration'
        }
      />

      {fetchError && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
          Could not load opportunities.{' '}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="underline"
          >
            Retry
          </button>
        </div>
      )}

      {showEmptyState ? (
        <div className="p-8 rounded-2xl border border-border bg-surface-raised text-center max-w-2xl mx-auto my-12 space-y-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent">
            <Radar size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-text">Find Target Career Opportunities</h3>
            <p className="text-small text-text-secondary leading-relaxed">
              We match you with real-world jobs and pinpoint missing skills based on your profile. Upload your resume or
              configure your career parameters to initialize the matching process.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href="/resumes"
              className="rounded-lg px-4 py-2 bg-accent hover:bg-accent-hover text-text-inverse text-xs font-bold transition-colors"
            >
              Upload Resume
            </a>
            <a
              href="/profile"
              className="rounded-lg px-4 py-2 border border-border hover:bg-surface-inset text-text text-xs font-bold transition-colors"
            >
              Configure Profile
            </a>
          </div>
        </div>
      ) : showPendingState ? (
        <div className="p-8 rounded-2xl border border-warning/20 bg-warning/5 text-center max-w-2xl mx-auto my-12 space-y-4">
          <Radar size={24} className="mx-auto text-warning" />
          <h3 className="text-base font-bold text-text">Matches are being prepared</h3>
          <p className="text-small text-text-secondary leading-relaxed">
            {matchMessage ||
              'Your profile is calibrated. Opportunity matching will appear after resume processing or profile update completes.'}
          </p>
        </div>
      ) : (
        <>
          {activeMatches.length > 0 && (
            <Panel>
              <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Matching Opportunities</h3>
                <span className="text-xs text-text-tertiary font-mono tracking-wider">
                  {simulationActive ? 'SIMULATION' : matchStatus === 'ready' ? 'LIVE MATCHES' : 'DYNAMIC MATCHER ACTIVE'}
                </span>
              </div>
              <div className="space-y-4 mt-3">
                {activeMatches.map((m, i) => (
                  <InteractiveCard key={i} className="p-4 relative overflow-hidden bg-surface-inset/50">
                    <div className="absolute top-0 right-0 h-full w-[2.5px] bg-gradient-to-b from-accent/30 to-transparent" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text">{m.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                          <span>{m.company}</span>
                          <span>•</span>
                          <span>{m.location || 'Remote'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-success/10 border border-success/25 text-success">
                          {m.compensation || m.estimated_career_impact}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-info/10 border border-info/25 text-info">
                          {formatMatchPercent(m.alignment_score)} match
                        </span>
                      </div>
                    </div>

                    {matchReasoning(m) && (
                      <div className="mt-3 p-3 rounded-lg bg-info/5 border border-info/20 text-small text-text-secondary leading-relaxed">
                        <span className="font-semibold text-info flex items-center gap-1 mb-1">
                          <HelpCircle size={12} /> Why you match this role:
                        </span>
                        {matchReasoning(m)}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs">
                      <div className="flex items-center gap-2.5 text-text-tertiary font-mono">
                        {m.status === 'LIVE' ||
                        (m.source &&
                          !['Vercel Seed', 'Stripe Seed', 'HashiCorp Seed', 'Anthropic Seed', 'Supabase Seed'].includes(
                            m.source
                          )) ? (
                          <span className="px-1.5 py-0.5 rounded bg-success/10 border border-success/25 text-xs uppercase tracking-wider font-bold text-success">
                            LIVE MATCH
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-warning/10 border border-warning/25 text-xs uppercase tracking-wider font-bold text-warning">
                            DEMO DATA
                          </span>
                        )}
                        {m.source && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-inset border border-border text-xs uppercase tracking-wider font-bold text-text-secondary font-mono">
                            {m.source}
                          </span>
                        )}
                        {m.posted_at && (
                          <span className="text-xs">Posted: {new Date(m.posted_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      {m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-success hover:opacity-90 text-text-inverse text-xs font-bold rounded transition-colors"
                        >
                          Apply Now →
                        </a>
                      ) : (
                        <span className="text-text-tertiary italic">No direct link</span>
                      )}
                    </div>
                  </InteractiveCard>
                ))}
              </div>
            </Panel>
          )}

          {activeMatches.length === 0 && (
            <Panel className="p-8 text-center max-w-lg mx-auto rounded-2xl">
              <Radar size={40} className="text-text-tertiary mx-auto mb-4 animate-pulse" />
              <h3 className="text-sm font-semibold text-text mb-2">No Relevant Opportunities Found</h3>
              <p className="text-small text-text-secondary leading-relaxed mb-4">
                No relevant opportunities found today. We&apos;ll continue monitoring the market and notify you when new
                matches appear.
              </p>
              <button
                onClick={fetchData}
                className="rounded px-4 py-2 text-xs bg-success/10 text-success border border-success/20 hover:bg-success/20 font-bold transition-all"
              >
                Refresh Opportunities
              </button>
            </Panel>
          )}

          {activeGaps.length > 0 && (
            <Panel>
              <SectionHeader title="Target Career Readiness" />
              <div className="mt-3 space-y-3">
                {activeGaps.map((g, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 py-3 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text">{g.target_role}</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {g.missing_skills.length > 0 ? (
                          g.missing_skills.map((s) => (
                            <span
                              key={s}
                              className="text-xs bg-surface-inset border border-border px-2 py-0.5 rounded text-text-secondary"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-success font-mono">ALL SKILL REQUIREMENTS MET</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-accent font-mono">{g.readiness_percentage}% ready</p>
                      <p className="text-xs text-text-tertiary uppercase font-mono mt-0.5">{g.estimated_completion_time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {activeRadar && (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeRadar.high_roi_skills.length > 0 && (
                <Panel>
                  <SectionHeader title="Skill Value Assessment" />
                  <div className="mt-3 space-y-2.5">
                    {activeRadar.high_roi_skills.map((s) => (
                      <div
                        key={s.skill}
                        className="flex items-center justify-between py-1.5 border-b border-border-subtle last:border-0"
                      >
                        <span className="text-xs text-text capitalize font-medium">{s.skill}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs">
                            {s.trend === 'rising' ? (
                              <span className="text-success flex items-center font-mono uppercase">
                                <ArrowUp size={10} /> Rising
                              </span>
                            ) : s.trend === 'cooling' ? (
                              <span className="text-warning flex items-center font-mono uppercase">
                                <ArrowDown size={10} /> Cooling
                              </span>
                            ) : (
                              <span className="text-text-tertiary flex items-center font-mono uppercase">Stable</span>
                            )}
                          </span>
                          <span className="text-xs text-text-tertiary font-mono">
                            Potential Impact: +{Math.round(s.roi * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <Panel>
                <SectionHeader title="Salary Progression Paths" />
                <div className="mt-3 space-y-3">
                  {activeRadar.salary_growth_paths.map((p, i) => (
                    <p key={i} className="text-small text-text-secondary leading-relaxed font-medium">
                      • {p}
                    </p>
                  ))}
                  {activeRadar.emerging_domains.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border-subtle">
                      <p className="text-xs text-text-tertiary uppercase tracking-wider font-mono mb-2">
                        Emerging industry sectors:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeRadar.emerging_domains.map((d) => (
                          <span
                            key={d}
                            className="text-xs border border-info/20 bg-info/5 text-info px-2 py-0.5 rounded capitalize"
                          >
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
      <div className="p-6 rounded-2xl border border-border bg-surface-raised space-y-4">
        <div className="h-5 w-40 bg-surface-inset rounded mb-2" />
        {[1, 2].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-surface-inset space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-surface-overlay rounded" />
                <div className="h-3.5 w-32 bg-surface-inset rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-20 bg-surface-inset rounded" />
                <div className="h-5 w-16 bg-surface-inset rounded" />
              </div>
            </div>
            <div className="h-10 w-full bg-surface-inset rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border border-border bg-surface-raised h-32" />
        <div className="p-6 rounded-2xl border border-border bg-surface-raised h-32" />
      </div>
    </div>
  );
}
