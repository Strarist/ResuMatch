/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader } from '@/components/ds';
import { Badge } from '@/components/ui/badge';
import { market as marketApi } from '@/lib/intelligence-client';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { BarChart3, TrendingUp, DollarSign, Target, Mail, ArrowRight, Award, Info } from 'lucide-react';

interface SkillDemand {
  skill: string;
  demand: number;
  trend: string;
  saturation: string;
  category: string;
  // New metadata fields
  source?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  generated_at?: string;
  methodology?: string;
}

interface RoiSkill {
  skill: string;
  roi_score: number;
  demand: number;
  trend: string;
  salary_premium: number;
  role_relevant: boolean;
  // New metadata fields
  source?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  generated_at?: string;
  methodology?: string;
}

interface Attractiveness {
  overall_score: number;
  portfolio_strength: number;
  stack_coherence: number;
  specialization_maturity: number;
  growth_signal: number;
  // New metadata fields
  source?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  generated_at?: string;
  methodology?: string;
}

interface SalaryTrajectory {
  seniority: string;
  estimated_range: { low: number; high: number };
  premium_factor: number;
  growth_potential: string;
}

interface OutreachForecast {
  projected_replies: number;
  projected_interviews: number;
  projected_offers: number;
  efficiency_score: number;
}

interface MarketData {
  skill_demand: SkillDemand[];
  roi_skills: RoiSkill[];
  recruiter_attractiveness: Attractiveness;
  salary_trajectory: SalaryTrajectory;
  high_value_missing: RoiSkill[];
  outreach_forecast?: OutreachForecast;
}

export default function CareerInsightsPage() {
  function renderConfidenceBadge(confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW') {
  const colorMap: Record<string, string> = {
    HIGH: 'bg-emerald-500 text-text',
    MEDIUM: 'bg-amber-500 text-text',
    LOW: 'bg-gray-500 text-text',
  };
  return <Badge className={colorMap[confidence] ?? 'bg-gray-500'}>{confidence}</Badge>;
}
const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const {
    simulationActive,
    metrics,
    activePersona,
    lifecycleStage,
    hasStrategicProfile,
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    if (simulationActive) {
      setLoading(false);
      return;
    }
    setFetchError(false);
    try {
      const snapshot = await marketApi.getSnapshot();
      setData(snapshot as unknown as MarketData);
    } catch (err) {
      console.error('Failed to load market intelligence:', err);
      setFetchError(true);
    }
    setLoading(false);
  }, [simulationActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const parseSalaryRange = (rangeStr: string) => {
    try {
      const clean = rangeStr.replace(/\$/g, '').replace(/k/g, '000').split('-');
      const low = parseInt(clean[0]?.trim() || '140000', 10);
      const high = parseInt(clean[1]?.trim() || '210000', 10);
      return { low, high };
    } catch {
      return { low: 140000, high: 210000 };
    }
  };

  const salaryRangeParsed = parseSalaryRange(activePersona.marketIntel.salaryRange);

  // Derive active data from selected persona in context
  const activeData: MarketData | null = simulationActive
    ? {
        skill_demand: activePersona.strongestSkills.map(skill => ({
          skill,
          demand: 0.85,
          trend: 'rising',
          saturation: 'medium',
          category: 'core_stack'
        })),
        roi_skills: activePersona.roadmap.map(node => ({
          skill: node.skill,
          roi_score: node.impactEstimate / 100,
          demand: 0.82,
          trend: node.priority === 'high' ? 'rising' : 'stable',
          salary_premium: node.priority === 'high' ? 0.22 : 0.12,
          role_relevant: true
        })),
        recruiter_attractiveness: {
          overall_score: metrics.recruiterConfidence / 100,
          portfolio_strength: activePersona.recruiterProfile?.productionReadiness || 0.85,
          stack_coherence: activePersona.recruiterProfile?.specializationStrength || 0.88,
          specialization_maturity: activePersona.recruiterProfile?.technicalDepth || 0.89,
          growth_signal: metrics.careerVelocity / 100,
        },
        salary_trajectory: {
          seniority: activePersona.targetRole,
          estimated_range: salaryRangeParsed,
          premium_factor: (metrics.matchScore - 70) / 100,
          growth_potential: activePersona.marketIntel.growthRate,
        },
        high_value_missing: activePersona.roadmap.filter(node => node.status === 'active').map(node => ({
          skill: node.skill,
          roi_score: node.impactEstimate / 100,
          demand: 0.85,
          trend: 'rising',
          salary_premium: 0.20,
          role_relevant: true
        })),
        outreach_forecast: {
          projected_replies: 7,
          projected_interviews: 3,
          projected_offers: 1,
          efficiency_score: 82
        }
      }
    : data;

  const showEmptyState = !simulationActive && !hasStrategicProfile;
  const marketDataToRender = activeData;
  const hasRenderableData = Boolean(marketDataToRender);

  if (fetchError && !simulationActive) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Career Insights & Market Trends"
          subtitle="Analyze target market demand, salary ranges, recruiter feedback, and professional response forecasts"
        />
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 max-w-2xl">
          Could not load market insights.{' '}
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
      </div>
    );
  }

  if (!showEmptyState && !hasRenderableData && !simulationActive) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Career Insights & Market Trends"
          subtitle="Analyze target market demand, salary ranges, recruiter feedback, and professional response forecasts"
        />
        <div className="p-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center max-w-2xl mx-auto my-12 space-y-4">
          <BarChart3 size={24} className="mx-auto text-amber-400" />
          <h3 className="text-base font-bold text-text">Market insights are being prepared</h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            Upload a resume or save your profile to generate salary benchmarks and demand trends.
          </p>
        </div>
      </div>
    );
  }

  if (!marketDataToRender) {
    return null;
  }

  const { skill_demand, roi_skills, recruiter_attractiveness: attr, salary_trajectory: salary, high_value_missing, outreach_forecast: outreach } = marketDataToRender;

  const currentOutreach = outreach || { projected_replies: 5, projected_interviews: 2, projected_offers: 1, efficiency_score: 72 };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Career Insights & Market Trends"
        subtitle="Analyze target market demand, salary ranges, recruiter feedback, and professional response forecasts"
      />

      {/* Onboarding Empty State Check */}
      {showEmptyState ? (
        <div className="p-8 rounded-2xl border border-border bg-surface-raised text-center max-w-2xl mx-auto my-12 space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
            <BarChart3 size={24} />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-text">Configure Career Insights & Salary Ranges</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              We compile salary benchmarks, recruiter matches, and demand trends based on your verified technical skills. Upload your resume or configure your career parameters to begin analysis.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <a
              href="/resumes"
              className="rounded-lg px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-colors"
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
      ) : (
        <>
      {/* 1. Core Career Indicators Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="border-border bg-surface-raised p-4 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Award size={14} className="text-emerald-400" />
              <span className="text-[10px] text-text-tertiary font-mono uppercase">Profile Strength</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{Math.round(attr.overall_score * 100)}%</p>
          </div>
          <span className="text-[9px] text-text-tertiary font-sans mt-2">Estimated recruiter match rate</span>
        </Panel>

        <Panel className="border-border bg-surface-raised p-4 flex flex-col justify-between relative">

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <DollarSign size={14} className="text-text-secondary" />
              <span className="text-[10px] text-text-tertiary font-mono uppercase">Base Market Salary</span>
            </div>
            <p className="text-sm font-bold text-text font-sans">${(salary.estimated_range.low / 1000).toFixed(0)}k–${(salary.estimated_range.high / 1000).toFixed(0)}k</p>
          </div>
          <span className="text-[9px] text-text-tertiary font-sans mt-2 capitalize truncate">{salary.seniority} standard</span>
        </Panel>

        <Panel className="border-border bg-surface-raised p-4 flex flex-col justify-between relative">

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[10px] text-text-tertiary font-mono uppercase">Growth Track</span>
            </div>
            <p className="text-sm font-bold text-emerald-400 capitalize">{salary.growth_potential}</p>
          </div>
          <span className="text-[9px] text-text-tertiary font-sans mt-2">Target domain demand trend</span>
        </Panel>

        <Panel className="border-border bg-surface-raised p-4 flex flex-col justify-between relative">

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Mail size={14} className="text-blue-400" />
              <span className="text-[10px] text-text-tertiary font-mono uppercase">Response Rate</span>
            </div>
            <p className="text-2xl font-bold text-text font-mono">{currentOutreach.efficiency_score}%</p>
          </div>
          <span className="text-[9px] text-text-tertiary font-sans mt-2">Estimated recruiter response rate</span>
        </Panel>
      </div>

      {/* 2. Recruiter Attractiveness Indices */}
      <Panel className="border-border bg-surface-raised p-5">
        <SectionHeader title="Recruiter Match Scorecard" subtitle="Key candidate qualifications evaluated by matching jobs" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Project Quality & Depth', value: attr.portfolio_strength, desc: 'Quality and complexity evidence in sample projects', confidence: attr.confidence, methodology: attr.methodology },
            { label: 'Technology Mix Balance', value: attr.stack_coherence, desc: 'Alignment and synergy of skills across target stack', confidence: attr.confidence, methodology: attr.methodology },
            { label: 'Area Expertise Level', value: attr.specialization_maturity, desc: 'Maturity level of domain-specific qualifications', confidence: attr.confidence, methodology: attr.methodology },
            { label: 'Upskilling & Progress Rate', value: attr.growth_signal, desc: 'Pace of technical upskilling and career progression', confidence: attr.confidence, methodology: attr.methodology },
          ].map(({ label, value, desc, confidence, methodology }) => (
            <div key={label} className="p-3 bg-surface-inset border border-border-subtle rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text">{label}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{Math.round(value * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
              <p className="text-[10px] text-text-tertiary">{desc}</p>
              <div className="flex items-center gap-2 mt-1">
                {renderConfidenceBadge(confidence)}
                {methodology && (<Info size={14} className="text-text-secondary cursor-pointer" aria-label={methodology} />)}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 3. Double Grid: High-Value Gaps & Outreach Funnel Projections */}
      <div className="grid md:grid-cols-12 gap-6">

        {/* Left Hand: High-Value Missing Skills (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <Panel className="border-border bg-surface-raised p-5 h-full">
            <SectionHeader title="High-Value Skills Deficit" subtitle="Bridging these technical gaps raises recruiter response rates" />
            <div className="mt-4 space-y-3">
              {skill_demand.map((s) => (
                <div key={s.skill} className="flex items-center justify-between p-2 rounded-lg bg-surface-inset border border-border-subtle">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text">{s.skill}</span>
                    <span className="text-xs text-text-secondary">Demand: {Math.round(s.demand * 100)}% ({s.trend})</span>
                    {s.source && <span className="text-xs text-text-tertiary mt-0.5">Source: {s.source}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderConfidenceBadge(s.confidence)}
                    {s.methodology && (
                      <Info size={14} className="text-text-secondary cursor-pointer" aria-label={s.methodology} />
                    )}
                  </div>
                </div>
              ))}
              {high_value_missing.length === 0 && <p className="text-xs text-text-tertiary italic">No critical skill gaps identified. Your technical stack is fully aligned.</p>}
            </div>
          </Panel>
        </div>

        {/* Right Hand: Outreach Conversion Forecast (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <Panel className="border-border bg-surface-raised p-5 h-full">
            <SectionHeader title="Outreach Campaign Forecast" subtitle="Projected outcome conversions per 30 recruiter contacts" />
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1 font-medium">
                  <span>Projected Replies</span>
                  <span className="font-semibold text-text font-mono">{currentOutreach.projected_replies}</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(currentOutreach.projected_replies / 30) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1 font-medium">
                  <span>Technical Interviews</span>
                  <span className="font-semibold text-text font-mono">{currentOutreach.projected_interviews}</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(currentOutreach.projected_interviews / 30) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-text-secondary mb-1 font-medium">
                  <span>Job Offer Projections</span>
                  <span className="font-semibold text-text font-mono">{currentOutreach.projected_offers}</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(currentOutreach.projected_offers / 30) * 100}%` }} />
                </div>
              </div>

              <div className="p-3 bg-surface-raised border border-border-subtle rounded-lg mt-4 text-[11px] text-text-secondary leading-relaxed">
                🚀 <span className="font-bold text-text">Outreach Insight</span>: Completing active roadmap sprints will increase projected conversions, boosting replies by ~35% based on hiring manager expectations.
              </div>
            </div>
          </Panel>
        </div>

      </div>

      {/* 4. Strategic Trajectory Growth Pathway */}
      <Panel className="border-border bg-surface-raised p-5">
        <SectionHeader title="Target Trajectory & Seniority Pathways" subtitle="Strategic guidance formulated for technical execution" />
        <div className="mt-4 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Active Specialization Track</h4>
            <p className="text-sm font-semibold text-text">{activePersona.specialization}</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your validated credentials demonstrate robust competence in core frameworks. Prioritizing backend infrastructure, caching, and infrastructure automation targets allows you to stand out to enterprise recruiters.
            </p>
          </div>
          <div className="w-full md:w-80 p-4 rounded-xl bg-slate-950 border border-border-subtle space-y-3">
            <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider font-mono">Outcomes Breakdown</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-tertiary">Premium Factor</span>
                <span className="text-text font-bold font-mono">+{Math.round(salary.premium_factor * 100)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="text-text-tertiary">Recruiter Pressure</span>
                <span className="text-emerald-400 font-bold uppercase">High</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-tertiary">Hiring Intensity</span>
                <span className="text-text font-bold font-mono">Active</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>
        </>
      )}
    </div>
  );
}
