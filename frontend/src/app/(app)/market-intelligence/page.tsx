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
  const { simulationActive, metrics } = useLivingSystem();

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

  // Resolve active data
  const activeData: MarketData | null = simulationActive
    ? {
        skill_demand: [
          { skill: 'CUDA Kernel Tuning', demand: 0.94, trend: 'rising', saturation: 'low', category: 'infrastructure' },
          { skill: 'vLLM Serving Orchestration', demand: 0.89, trend: 'rising', saturation: 'medium', category: 'serving' },
          { skill: 'Raft consensus protocols', demand: 0.85, trend: 'rising', saturation: 'low', category: 'distributed' },
          { skill: 'Rust compiler extension', demand: 0.78, trend: 'stable', saturation: 'high', category: 'languages' },
          { skill: 'WASM edge optimization', demand: 0.72, trend: 'cooling', saturation: 'medium', category: 'languages' },
        ],
        roi_skills: [
          { skill: 'CUDA Kernel Tuning', roi_score: 0.94, demand: 0.94, trend: 'rising', salary_premium: 0.28, role_relevant: true },
          { skill: 'Raft consensus protocols', roi_score: 0.88, demand: 0.85, trend: 'rising', salary_premium: 0.22, role_relevant: true },
          { skill: 'vLLM serving optimization', roi_score: 0.85, demand: 0.89, trend: 'rising', salary_premium: 0.18, role_relevant: true },
          { skill: 'Rust memory diagnostics', roi_score: 0.76, demand: 0.78, trend: 'stable', salary_premium: 0.15, role_relevant: false },
        ],
        recruiter_attractiveness: {
          overall_score: metrics.recruiterConfidence / 100,
          portfolio_strength: 0.92,
          stack_coherence: 0.88,
          specialization_maturity: 0.89,
          growth_signal: metrics.careerVelocity / 100,
        },
        salary_trajectory: {
          seniority: 'Principal AI & Systems Architect',
          estimated_range: { low: 195000, high: 275000 },
          premium_factor: (metrics.matchScore - 70) / 100,
          growth_potential: 'exponential',
        },
        high_value_missing: [
          { skill: 'CUDA Kernel Optimization', roi_score: 0.95, demand: 0.94, trend: 'rising', salary_premium: 0.28, role_relevant: true },
          { skill: 'Distributed consensus verification', roi_score: 0.89, demand: 0.85, trend: 'rising', salary_premium: 0.22, role_relevant: true },
        ],
      }
    : data;

  const isDormant = !activeData;

  const fallbackMarketData: MarketData = {
    skill_demand: [
      { skill: 'Python Systems Development', demand: 0.78, trend: 'stable', saturation: 'medium', category: 'languages' },
      { skill: 'Kubernetes Orchestration', demand: 0.85, trend: 'rising', saturation: 'high', category: 'infrastructure' },
      { skill: 'Distributed Caching (Redis)', demand: 0.74, trend: 'rising', saturation: 'medium', category: 'distributed' },
      { skill: 'Go Web Services', demand: 0.80, trend: 'stable', saturation: 'medium', category: 'languages' },
    ],
    roi_skills: [
      { skill: 'Kubernetes Orchestration', roi_score: 0.82, demand: 0.85, trend: 'rising', salary_premium: 0.18, role_relevant: true },
      { skill: 'Distributed Caching (Redis)', roi_score: 0.76, demand: 0.74, trend: 'rising', salary_premium: 0.14, role_relevant: true },
      { skill: 'Go Concurrency model', roi_score: 0.84, demand: 0.80, trend: 'rising', salary_premium: 0.16, role_relevant: false },
    ],
    recruiter_attractiveness: {
      overall_score: 0.42,
      portfolio_strength: 0.35,
      stack_coherence: 0.40,
      specialization_maturity: 0.38,
      growth_signal: 0.30,
    },
    salary_trajectory: {
      seniority: 'Cloud Systems Engineer',
      estimated_range: { low: 110000, high: 145000 },
      premium_factor: 0.12,
      growth_potential: 'stable',
    },
    high_value_missing: [
      { skill: 'CUDA Kernel Optimization', roi_score: 0.95, demand: 0.94, trend: 'rising', salary_premium: 0.28, role_relevant: true },
      { skill: 'Distributed consensus verification', roi_score: 0.89, demand: 0.85, trend: 'rising', salary_premium: 0.22, role_relevant: true },
    ],
  };

  const marketDataToRender = activeData || fallbackMarketData;
  const { skill_demand, roi_skills, recruiter_attractiveness: attr, salary_trajectory: salary, high_value_missing } = marketDataToRender;

  return (
    <div className="space-y-6">
      <SectionHeader title="Market Intelligence" subtitle={simulationActive ? "Skill market analysis & opportunity detection (Simulation Active)" : "Skill market analysis & opportunity detection"} />

      {/* Dormant state banner */}
      {isDormant && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <BarChart3 size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Market Telemetry in Standby Mode</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Awaiting profile calibration. Upload resume portfolio artifacts on the{' '}
              <a href="/resumes" className="text-blue-400 underline hover:text-blue-300">Resumes & Portfolio</a>{' '}
              view or toggle Simulation Mode in the sidebar footer to run live market intelligence vector calculations.
            </p>
          </div>
        </div>
      )}

      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel>
          <p className="text-xs text-text-tertiary mb-1">Recruiter Score</p>
          <p className="text-2xl font-bold text-accent">{Math.round(attr.overall_score * 100)}%</p>
        </Panel>
        <Panel>
          <p className="text-xs text-text-tertiary mb-1">Salary Range</p>
          <p className="text-lg font-bold text-text">${(salary.estimated_range.low / 1000).toFixed(0)}k–${(salary.estimated_range.high / 1000).toFixed(0)}k</p>
          <p className="text-xs text-text-tertiary capitalize">{salary.seniority} level</p>
        </Panel>
        <Panel>
          <p className="text-xs text-text-tertiary mb-1">Growth Potential</p>
          <p className="text-lg font-bold text-success capitalize">{salary.growth_potential}</p>
        </Panel>
        <Panel>
          <p className="text-xs text-text-tertiary mb-1">Premium Factor</p>
          <p className="text-2xl font-bold text-text">+{Math.round(salary.premium_factor * 100)}%</p>
        </Panel>
      </div>

      {/* Recruiter Attractiveness Breakdown */}
      <Panel>
        <SectionHeader title="Recruiter Attractiveness" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Portfolio Strength', value: attr.portfolio_strength },
            { label: 'Stack Coherence', value: attr.stack_coherence },
            { label: 'Specialization Maturity', value: attr.specialization_maturity },
            { label: 'Growth Signal', value: attr.growth_signal },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-text-secondary w-44">{label}</span>
              <div className="flex-1 h-2 bg-surface-inset rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${Math.round(value * 100)}%` }} />
              </div>
              <span className="text-xs text-text-tertiary w-8">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* High-Value Missing Skills */}
      {high_value_missing.length > 0 && (
        <Panel>
          <SectionHeader title="High-Value Missing Skills" />
          <div className="mt-3 space-y-2">
            {high_value_missing.map((s) => (
              <div key={s.skill} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text capitalize">{s.skill}</span>
                  {s.role_relevant && <StatusBadge status="success">role-relevant</StatusBadge>}
                  <StatusBadge status={s.trend === 'rising' ? 'warning' : 'neutral'}>{s.trend}</StatusBadge>
                </div>
                <span className="text-xs text-accent font-medium">+{Math.round(s.salary_premium * 100)}% premium</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Skill ROI Table */}
      <Panel>
        <SectionHeader title="Skill ROI Rankings" />
        <div className="mt-3 space-y-2">
          {roi_skills.map((s) => (
            <div key={s.skill} className="flex items-center gap-3">
              <span className="text-sm text-text w-32 capitalize truncate">{s.skill}</span>
              <div className="flex-1 h-2 bg-surface-inset rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${Math.round(s.roi_score * 100)}%` }} />
              </div>
              <span className="text-xs text-text-tertiary w-12">ROI {Math.round(s.roi_score * 100)}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Current Skill Demand */}
      {skill_demand.length > 0 && (
        <Panel>
          <SectionHeader title="Your Skills — Market Demand" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {skill_demand.map((s) => (
              <div key={s.skill} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-text capitalize">{s.skill}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.trend === 'rising' ? 'success' : 'neutral'}>{s.trend}</StatusBadge>
                  <span className="text-xs text-text-tertiary">{Math.round(s.demand * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
