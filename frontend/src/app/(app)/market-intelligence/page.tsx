'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { BarChart3 } from 'lucide-react';

interface SkillDemand { skill: string; demand: number; trend: string; saturation: string; category: string; }
interface RoiSkill { skill: string; roi_score: number; demand: number; trend: string; salary_premium: number; role_relevant: boolean; }
interface Attractiveness { overall_score: number; portfolio_strength: number; stack_coherence: number; specialization_maturity: number; growth_signal: number; }
interface SalaryTrajectory { seniority: string; estimated_range: { low: number; high: number }; premium_factor: number; growth_potential: string; }

interface MarketData {
  skill_demand: SkillDemand[];
  roi_skills: RoiSkill[];
  recruiter_attractiveness: Attractiveness;
  salary_trajectory: SalaryTrajectory;
  high_value_missing: RoiSkill[];
}

export default function MarketIntelligencePage() {
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
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/market-intelligence/snapshot`, { headers });
      if (res.ok) setData(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, [simulationActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>;

  const parseSalaryRange = (rangeStr: string) => {
    try {
      const clean = rangeStr.replace(/\$/g, '').replace(/k/g, '000').split('-');
      const low = parseInt(clean[0]?.trim() || '150000', 10);
      const high = parseInt(clean[1]?.trim() || '250000', 10);
      return { low, high };
    } catch {
      return { low: 150000, high: 220000 };
    }
  };

  const salaryRangeParsed = parseSalaryRange(activePersona.marketIntel.salaryRange);

  // Derive active data from selected persona in context
  const activeData: MarketData | null = simulationActive
    ? {
        skill_demand: activePersona.strongestSkills.map(skill => ({
          skill,
          demand: 0.85 + (Math.random() * 0.1),
          trend: 'rising',
          saturation: 'medium',
          category: 'core_stack'
        })),
        roi_skills: activePersona.roadmap.map(node => ({
          skill: node.skill,
          roi_score: node.impactEstimate / 100,
          demand: 0.80 + (node.priority === 'high' ? 0.15 : 0.05),
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
        }))
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
      overall_score: 0.25,
      portfolio_strength: 0.20,
      stack_coherence: 0.25,
      specialization_maturity: 0.30,
      growth_signal: 0.10,
    },
    salary_trajectory: {
      seniority: 'Awaiting Calibration',
      estimated_range: { low: 110000, high: 145000 },
      premium_factor: 0.05,
      growth_potential: 'stable',
    },
    high_value_missing: [
      { skill: 'GraphQL Federation', roi_score: 0.95, demand: 0.94, trend: 'rising', salary_premium: 0.28, role_relevant: true },
    ],
  };

  const marketDataToRender = isDormant ? fallbackMarketData : (activeData || fallbackMarketData);
  const { skill_demand, roi_skills, recruiter_attractiveness: attr, salary_trajectory: salary, high_value_missing } = marketDataToRender;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Market Intelligence" subtitle={simulationActive ? "Skill market analysis & opportunity detection (Simulation Sandbox)" : "Skill market analysis & opportunity detection"} />

      {/* Dormant state banner */}
      {isDormant && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <BarChart3 size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Market Telemetry in Standby Mode</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Your profile is currently uncalibrated. Ingest resume portfolio artifacts on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</a>{' '}
              view or select a baseline persona in the sidebar to initialize real-time market trends.
            </p>
          </div>
        </div>
      )}

      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Recruiter Score</span>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{Math.round(attr.overall_score * 100)}%</p>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Salary Range</span>
          <p className="text-sm font-bold text-white font-sans">${(salary.estimated_range.low / 1000).toFixed(0)}k–${(salary.estimated_range.high / 1000).toFixed(0)}k</p>
          <span className="text-[9px] text-slate-400 block mt-0.5 capitalize truncate">{salary.seniority} level</span>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Growth Potential</span>
          <p className="text-sm font-bold text-emerald-400 capitalize">{salary.growth_potential}</p>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Premium Factor</span>
          <p className="text-2xl font-bold text-white font-mono">+{Math.round(salary.premium_factor * 100)}%</p>
        </Panel>
      </div>

      {/* Recruiter Attractiveness Breakdown */}
      <Panel className="border-white/[0.04] bg-white/[0.015]">
        <SectionHeader title="Recruiter Attractiveness Indices" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Portfolio Strength', value: attr.portfolio_strength },
            { label: 'Stack Coherence', value: attr.stack_coherence },
            { label: 'Specialization Maturity', value: attr.specialization_maturity },
            { label: 'Growth Signal', value: attr.growth_signal },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-44 font-sans font-medium">{label}</span>
              <div className="flex-grow h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* High-Value Missing Skills */}
      {high_value_missing.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="High-Value Gaps Matrix" />
          <div className="mt-3 space-y-2.5">
            {high_value_missing.map((s) => (
              <div key={s.skill} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white/90 capitalize">{s.skill}</span>
                  {s.role_relevant && <StatusBadge status="success">role-relevant</StatusBadge>}
                  <StatusBadge status={s.trend === 'rising' ? 'warning' : 'neutral'}>{s.trend.toUpperCase()}</StatusBadge>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">+{Math.round(s.salary_premium * 100)}% salary premium</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Skill ROI Table */}
      <Panel className="border-white/[0.04] bg-white/[0.015]">
        <SectionHeader title="Bridging ROI Rankings" />
        <div className="mt-3 space-y-3">
          {roi_skills.map((s) => (
            <div key={s.skill} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-32 capitalize truncate font-sans font-medium">{s.skill}</span>
              <div className="flex-grow h-2 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(s.roi_score * 100)}%` }} />
              </div>
              <span className="text-[10px] text-slate-500 font-mono w-16 text-right">Value: +{Math.round(s.roi_score * 100)} ROI</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Current Skill Demand */}
      {skill_demand.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Validated Skills — Recruiter Demand" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {skill_demand.map((s) => (
              <div key={s.skill} className="flex items-center justify-between py-1.5 border-b border-white/[0.02] last:border-0">
                <span className="text-xs text-slate-300 capitalize font-medium">{s.skill}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.trend === 'rising' ? 'success' : 'neutral'}>{s.trend.toUpperCase()}</StatusBadge>
                  <span className="text-[10px] text-slate-500 font-mono">{Math.round(s.demand * 100)}% demand</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
