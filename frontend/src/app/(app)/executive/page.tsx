'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from '@/lib/env';
import { PageContainer, DashboardGrid, MetricCard, GlassPanel, SectionLabel, WorkspaceCard, LoadingPulse, EmptyState } from '@/components/workspace';
import { BarChart3, Zap, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface FocusData {
  focus: { primary_focus: string; secondary_focus: string; strategic_reasoning: string; attention_budget: { level: string; max_active_items: number }; specialization_maturity: { level: string; score: number; domain: string | null }; roadmap_load: { active_nodes: number; capacity: string; overloaded: boolean }; execution_priority_order: string[]; suppressed_focuses: string[]; };
  plan: { immediate_actions: string[]; weekly_targets: string[]; strategic_objective: string; blocked_by: string[]; estimated_completion_window: string; plan_confidence: number; };
  execution: { momentum_score: number; execution_style: string; stagnation_risk: string; };
  risks: { risk_score: number; count: number; };
}

export default function ExecutivePage() {
  const [data, setData] = useState<FocusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try { const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/strategic/focus`, { headers }); if (res.ok) setData(await res.json()); } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageContainer title="Executive" subtitle="Strategic command center"><LoadingPulse rows={6} /></PageContainer>;
  if (!data) return <PageContainer title="Executive" subtitle="Strategic command center"><EmptyState icon={BarChart3} title="No strategic data" description="Build your profile by uploading a resume and completing roadmap items." /></PageContainer>;

  const { focus, plan, execution, risks } = data;

  return (
    <PageContainer title="Executive" subtitle="Strategic command center">
      {/* Primary Focus */}
      <GlassPanel className="border-blue-400/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Primary Focus</p>
            <p className="text-lg font-semibold text-blue-300 capitalize">{focus.primary_focus.replace(/_/g, ' ')}</p>
            <p className="text-xs text-white/40 mt-1.5 max-w-lg">{focus.strategic_reasoning}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-400/20 text-blue-300 bg-blue-500/[0.06]">{focus.specialization_maturity.level.replace(/_/g, ' ')}</span>
            {focus.specialization_maturity.domain && <p className="text-[10px] text-white/25 mt-1 capitalize">{focus.specialization_maturity.domain}</p>}
          </div>
        </div>
      </GlassPanel>

      {/* Key Metrics */}
      <DashboardGrid cols={4}>
        <MetricCard label="Momentum" value={`${Math.round(execution.momentum_score * 100)}%`} icon={Zap} />
        <MetricCard label="Attention Budget" value={focus.attention_budget.level} icon={Target} />
        <MetricCard label="Roadmap Load" value={`${focus.roadmap_load.active_nodes} nodes`} icon={BarChart3} />
        <MetricCard label="Risk Level" value={`${Math.round(risks.risk_score * 100)}%`} icon={AlertTriangle} />
      </DashboardGrid>

      {/* Execution Plan */}
      <div className="grid lg:grid-cols-2 gap-4">
        <GlassPanel>
          <SectionLabel>Execution Plan</SectionLabel>
          <p className="text-sm text-blue-300 font-medium mb-1">{plan.strategic_objective}</p>
          <p className="text-[10px] text-white/25 mb-4">{plan.estimated_completion_window} • {Math.round(plan.plan_confidence * 100)}% confidence</p>

          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Immediate Actions</p>
          <div className="space-y-1.5">
            {plan.immediate_actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                <CheckCircle size={12} className="text-emerald-400/60 mt-0.5 flex-shrink-0" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionLabel>Weekly Targets</SectionLabel>
          <div className="space-y-1.5 mb-4">
            {plan.weekly_targets.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                <Clock size={12} className="text-blue-400/60 mt-0.5 flex-shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>

          {plan.blocked_by.length > 0 && (
            <>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Blockers</p>
              <div className="space-y-1.5">
                {plan.blocked_by.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-300/60">
                    <AlertTriangle size={12} className="text-red-400/60 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassPanel>
      </div>

      {/* Priority Queue */}
      {focus.execution_priority_order.length > 0 && (
        <WorkspaceCard>
          <SectionLabel>Execution Priority Queue</SectionLabel>
          <div className="space-y-1">
            {focus.execution_priority_order.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-white/[0.02]">
                <span className="text-[9px] font-mono text-white/20 w-4">{i + 1}</span>
                <span className="text-xs text-white/50 capitalize">{item.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}
    </PageContainer>
  );
}
