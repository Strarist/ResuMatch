/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { BarChart3, TrendingUp, DollarSign, Target, Mail, ArrowRight, Award } from 'lucide-react';

interface SkillDemand {
  skill: string;
  demand: number;
  trend: string;
  saturation: string;
  category: string;
}

interface RoiSkill {
  skill: string;
  roi_score: number;
  demand: number;
  trend: string;
  salary_premium: number;
  role_relevant: boolean;
}

interface Attractiveness {
  overall_score: number;
  portfolio_strength: number;
  stack_coherence: number;
  specialization_maturity: number;
  growth_signal: number;
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
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    simulationActive,
    metrics,
    activePersona,
    lifecycleStage
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    if (simulationActive) {
      setLoading(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/market-intelligence/snapshot`, { headers });
      if (res.ok) setData(await res.json());
    } catch { /* Fail silently */ }
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

  const isDormant = lifecycleStage === 1;

  const fallbackMarketData: MarketData = {
    skill_demand: [
      { skill: 'Python Systems Development', demand: 0.78, trend: 'stable', saturation: 'medium', category: 'languages' },
      { skill: 'Kubernetes Orchestration', demand: 0.85, trend: 'rising', saturation: 'high', category: 'infrastructure' },
      { skill: 'Distributed Caching (Redis)', demand: 0.74, trend: 'rising', saturation: 'medium', category: 'distributed' },
    ],
    roi_skills: [
      { skill: 'Kubernetes Orchestration', roi_score: 0.82, demand: 0.85, trend: 'rising', salary_premium: 0.18, role_relevant: true },
      { skill: 'Distributed Caching (Redis)', roi_score: 0.76, demand: 0.74, trend: 'rising', salary_premium: 0.14, role_relevant: true },
    ],
    recruiter_attractiveness: {
      overall_score: 0.65,
      portfolio_strength: 0.70,
      stack_coherence: 0.68,
      specialization_maturity: 0.62,
      growth_signal: 0.55,
    },
    salary_trajectory: {
      seniority: 'Awaiting Calibration',
      estimated_range: { low: 110000, high: 145000 },
      premium_factor: 0.05,
      growth_potential: 'stable',
    },
    high_value_missing: [
      { skill: 'GraphQL Federation', roi_score: 0.95, demand: 0.94, trend: 'rising', salary_premium: 0.22, role_relevant: true },
      { skill: 'Distributed Caching (Redis)', roi_score: 0.76, demand: 0.74, trend: 'rising', salary_premium: 0.14, role_relevant: true }
    ],
    outreach_forecast: {
      projected_replies: 5,
      projected_interviews: 2,
      projected_offers: 1,
      efficiency_score: 72
    }
  };

  const marketDataToRender = isDormant ? fallbackMarketData : (activeData || fallbackMarketData);
  const { skill_demand, roi_skills, recruiter_attractiveness: attr, salary_trajectory: salary, high_value_missing, outreach_forecast: outreach } = marketDataToRender;

  const currentOutreach = outreach || { projected_replies: 5, projected_interviews: 2, projected_offers: 1, efficiency_score: 72 };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader 
        title="Career Insights & Market Dynamics" 
        subtitle="Analyze target market demand, salary curves, recruiter indicators, and professional outreach forecasts" 
      />

      {/* Onboarding Empty State Banner */}
      {isDormant && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <BarChart3 size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Calibrate Your Insights Dashboard</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Your career analytics are currently on a baseline standard. Ingest a resume PDF in the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resume</a>{' '}
              workspace to run real-time skill matching algorithms and calibrate specific market salary premium rates.
            </p>
          </div>
        </div>
      )}

      {/* 1. Core Career Indicators Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="border-white/[0.04] bg-white/[0.015] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Award size={14} className="text-emerald-400" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Hiring Readiness</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{Math.round(attr.overall_score * 100)}%</p>
          </div>
          <span className="text-[9px] text-slate-500 font-sans mt-2">Overall profile screening rate</span>
        </Panel>

        <Panel className="border-white/[0.04] bg-white/[0.015] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <DollarSign size={14} className="text-white/40" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Base Market Salary</span>
            </div>
            <p className="text-sm font-bold text-white font-sans">${(salary.estimated_range.low / 1000).toFixed(0)}k–${(salary.estimated_range.high / 1000).toFixed(0)}k</p>
          </div>
          <span className="text-[9px] text-slate-500 font-sans mt-2 capitalize truncate">{salary.seniority} standard</span>
        </Panel>

        <Panel className="border-white/[0.04] bg-white/[0.015] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Growth Track</span>
            </div>
            <p className="text-sm font-bold text-emerald-400 capitalize">{salary.growth_potential}</p>
          </div>
          <span className="text-[9px] text-slate-500 font-sans mt-2">Target domain demand trend</span>
        </Panel>

        <Panel className="border-white/[0.04] bg-white/[0.015] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Mail size={14} className="text-blue-400" />
              <span className="text-[10px] text-slate-500 font-mono uppercase">Outreach Efficiency</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{currentOutreach.efficiency_score}%</p>
          </div>
          <span className="text-[9px] text-slate-500 font-sans mt-2">Conversion efficiency score</span>
        </Panel>
      </div>

      {/* 2. Recruiter Attractiveness Indices */}
      <Panel className="border-white/[0.04] bg-white/[0.015] p-5">
        <SectionHeader title="Recruiter Attractiveness Indices" subtitle="Candidate scorecard metrics evaluated by matching algorithms" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Portfolio Technical Strength', value: attr.portfolio_strength, desc: 'Quality and complexity evidence in sample projects' },
            { label: 'Stack Integration Coherence', value: attr.stack_coherence, desc: 'Alignment and synergy of skills across target stack' },
            { label: 'Specialization Technical Depth', value: attr.specialization_maturity, desc: 'Maturity level of domain-specific qualifications' },
            { label: 'Growth & Velocity Signals', value: attr.growth_signal, desc: 'Pace of technical upskilling and career progression' },
          ].map(({ label, value, desc }) => (
            <div key={label} className="p-3 bg-white/[0.005] border border-white/[0.03] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90">{label}</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{Math.round(value * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </Panel>

      {/* 3. Double Grid: High-Value Gaps & Outreach Funnel Projections */}
      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left Hand: High-Value Missing Skills (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <Panel className="border-white/[0.04] bg-white/[0.015] p-5 h-full">
            <SectionHeader title="High-Value Skills Deficit" subtitle="Bridging these technical gaps raises recruiter response rates" />
            <div className="mt-4 space-y-3">
              {high_value_missing.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No critical skill gaps identified. Your technical stack is fully aligned.</p>
              ) : (
                high_value_missing.map((s) => (
                  <div key={s.skill} className="p-3 rounded-lg bg-[#080c14] border border-white/[0.03] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/90">{s.skill}</span>
                        {s.role_relevant && <StatusBadge status="success">High Priority</StatusBadge>}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Recruiter demand index: {Math.round(s.demand * 100)}% ({s.trend === 'rising' ? 'Rising demand' : 'Stable'})</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-400 font-mono font-bold block">+{Math.round(s.salary_premium * 100)}%</span>
                      <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-mono">Salary Premium</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Right Hand: Outreach Conversion Forecast (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <Panel className="border-white/[0.04] bg-white/[0.015] p-5 h-full">
            <SectionHeader title="Outreach Campaign Forecast" subtitle="Projected outcome conversions per 30 recruiter contacts" />
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1 font-medium">
                  <span>Projected Replies</span>
                  <span className="font-semibold text-white font-mono">{currentOutreach.projected_replies}</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.04]">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(currentOutreach.projected_replies / 30) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1 font-medium">
                  <span>Technical Interviews</span>
                  <span className="font-semibold text-white font-mono">{currentOutreach.projected_interviews}</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.04]">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(currentOutreach.projected_interviews / 30) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-white/60 mb-1 font-medium">
                  <span>Job Offer Projections</span>
                  <span className="font-semibold text-white font-mono">{currentOutreach.projected_offers}</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.04]">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(currentOutreach.projected_offers / 30) * 100}%` }} />
                </div>
              </div>

              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg mt-4 text-[11px] text-slate-400 leading-relaxed">
                🚀 <span className="font-bold text-white">Outreach Insight</span>: Completing active roadmap sprints will increase projected conversions, boosting replies by ~35% based on hiring manager expectations.
              </div>
            </div>
          </Panel>
        </div>

      </div>

      {/* 4. Strategic Trajectory Growth Pathway */}
      <Panel className="border-white/[0.04] bg-white/[0.015] p-5">
        <SectionHeader title="Target Trajectory & Seniority Pathways" subtitle="Strategic guidance formulated for technical execution" />
        <div className="mt-4 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Specialization Track</h4>
            <p className="text-sm font-semibold text-white">{activePersona.specialization}</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your validated credentials demonstrate robust competence in core frameworks. Prioritizing backend infrastructure, caching, and infrastructure automation targets allows you to stand out to enterprise recruiters.
            </p>
          </div>
          <div className="w-full md:w-80 p-4 rounded-xl bg-slate-950 border border-white/[0.03] space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Outcomes Breakdown</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span className="text-slate-500">Premium Factor</span>
                <span className="text-white font-bold font-mono">+{Math.round(salary.premium_factor * 100)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.02]">
                <span className="text-slate-500">Recruiter Pressure</span>
                <span className="text-emerald-400 font-bold uppercase">High</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Hiring Intensity</span>
                <span className="text-white font-bold font-mono">Active</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
