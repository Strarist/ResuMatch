'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from '@/lib/env';
import { PageContainer, DashboardGrid, MetricCard, GlassPanel, SectionLabel, InsightPanel, WorkspaceCard, LoadingPulse, EmptyState } from '@/components/workspace';
import { Brain, Target, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useLivingSystem } from '@/context/LivingSystemContext';

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
  drift_detected: boolean;
  drift_details: string | null;
}

interface Recommendation {
  type: string;
  title: string;
  explanation: string;
  priority: string;
  confidence: number;
  estimated_impact: string;
  related_domains: string[];
}

export default function IntelligenceDashboard() {
  const [apiSummary, setApiSummary] = useState<Summary | null>(null);
  const [apiRecs, setApiRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { simulationActive, metrics, feed, roadmap } = useLivingSystem();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [s, r] = await Promise.all([
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/summary`, { headers: h }).then(res => res.ok ? res.json() : null),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/recommendations`, { headers: h }).then(res => res.ok ? res.json() : null),
      ]);
      if (s) setApiSummary(s);
      if (r) setApiRecs(r.recommendations || []);
    } catch { /* non-critical */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchData]);

  if (loading) return <PageContainer title="Intelligence" subtitle="AI career operating system"><LoadingPulse rows={6} /></PageContainer>;

  // Map simulation state to matching structures
  const activeSummary: Summary | null = simulationActive
    ? {
        dominant_path: 'AI & Distributed Systems Architecture',
        secondary_paths: ['High-Performance Computing', 'Infrastructure Compiler Dev'],
        competitiveness: metrics.matchScore / 100,
        confidence: 0.94,
        market_alignment: metrics.marketFit / 100,
        salary_range: { low: 185000, high: 265000 },
        growth_potential: 'exponential',
        roadmap_momentum: metrics.careerVelocity / 100,
        focus_areas: ['CUDA optimization', 'Consensus logic', 'LLM serving'],
        adjacent_roles: [
          { role: 'GPU Infrastructure Engineer', readiness: 0.91, gap_skills: ['CUDA Kernel Optimization'] },
          { role: 'Consensus Core Developer', readiness: 0.88, gap_skills: ['Raft/Paxos consensus experience'] },
          { role: 'Compiler Systems Architect', readiness: 0.95, gap_skills: ['Rust memory bounds validation'] },
        ],
        drift_detected: false,
        drift_details: null,
      }
    : apiSummary;

  // Recommendations mapping from active simulation roadmap
  const activeRecs: Recommendation[] = simulationActive
    ? roadmap.map((node) => ({
        type: 'skill_acquisition',
        title: `Integrate ${node.skill}`,
        explanation: node.reason,
        priority: node.priority,
        confidence: node.impactEstimate,
        estimated_impact: `Estimated trajectory impact: +${Math.round(node.impactEstimate / 10)}% recruiter readiness matching key pipelines.`,
        related_domains: [node.skill.split(' ')[0] || ''],
      }))
    : apiRecs;

  if (!activeSummary) {
    return (
      <PageContainer title="Intelligence" subtitle="Unified AI career operating system">
        <EmptyState
          icon={Brain}
          title="Career Intelligence Dehydrated"
          description="Analyze a profile or activate simulated telemetry to boot up the unified intelligence matrix."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Intelligence"
      subtitle={simulationActive ? "Unified AI career operating system (Simulation Sandbox)" : "Unified AI career operating system"}
    >
      {activeSummary.drift_detected && activeSummary.drift_details && (
        <WorkspaceCard className="border-amber-400/20 bg-amber-500/[0.04]">
          <div className="flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" /><span className="text-xs text-amber-300">{activeSummary.drift_details}</span></div>
        </WorkspaceCard>
      )}

      {/* Metric Telemetry Grid */}
      <DashboardGrid cols={4}>
        <MetricCard label="Dominant Path" value={activeSummary.dominant_path} icon={Brain} />
        <MetricCard label="Competitiveness" value={`${Math.round(activeSummary.competitiveness * 100)}%`} icon={Target} />
        <MetricCard label="Market Alignment" value={`${Math.round(activeSummary.market_alignment * 100)}%`} icon={TrendingUp} />
        <MetricCard label="Salary Range" value={`$${(activeSummary.salary_range.low / 1000).toFixed(0)}k–${(activeSummary.salary_range.high / 1000).toFixed(0)}k`} icon={DollarSign} />
      </DashboardGrid>

      {/* Strategic Actions */}
      {activeRecs.length > 0 && (
        <GlassPanel>
          <SectionLabel>Strategic Recommendations</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3">
            {activeRecs.slice(0, 6).map((rec, i) => (
              <InsightPanel key={i} title={rec.title} confidence={rec.confidence}>
                <p className="leading-relaxed mb-2">{rec.explanation}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${rec.priority === 'high' ? 'border-red-400/20 text-red-400 bg-red-500/[0.06]' : 'border-amber-400/20 text-amber-400 bg-amber-500/[0.06]'}`}>{rec.priority}</span>
                  <span className="text-[9px] text-white/25">{rec.estimated_impact}</span>
                </div>
              </InsightPanel>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Adjacent Role Fits */}
      {activeSummary.adjacent_roles.length > 0 && (
        <GlassPanel>
          <SectionLabel>Adjacent Opportunities</SectionLabel>
          <div className="space-y-2">
            {activeSummary.adjacent_roles.map((role, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
                <div className="flex flex-col">
                  <span className="text-xs text-white/60 font-medium">{role.role}</span>
                  <span className="text-[9px] text-white/20 mt-0.5">Gap: {role.gap_skills.join(' • ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 rounded-full bg-white/[0.04] overflow-hidden"><div className="h-full rounded-full bg-blue-400/60 transition-all duration-1000" style={{ width: `${role.readiness * 100}%` }} /></div>
                  <span className="text-[10px] text-white/40 w-8 text-right font-mono">{Math.round(role.readiness * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* System Event Logs */}
      {feed.length > 0 && (
        <WorkspaceCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Intelligence Event Log</SectionLabel>
            <span className="text-[8px] text-white/20 font-mono flex items-center gap-1">
              SYSTEM LIVE TELEMETRY
            </span>
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {feed.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md text-xs text-white/35 hover:bg-white/[0.01] transition-colors">
                <span className="text-[9px] text-blue-400/50 font-mono">[{item.source.toUpperCase()}]</span>
                <span className="truncate flex-1">{item.message}</span>
                <span className="text-[9px] text-white/20 font-mono">{new Date(item.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}
    </PageContainer>
  );
}
