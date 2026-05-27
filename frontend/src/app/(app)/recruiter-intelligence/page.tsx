'use client';

import { useCallback, useEffect, useState } from 'react';
import { env } from '@/lib/env';
import { PageContainer, DashboardGrid, MetricCard, GlassPanel, SectionLabel, WorkspaceCard, LoadingPulse, EmptyState } from '@/components/workspace';
import { UserCheck, Shield, Award, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLivingSystem } from '@/context/LivingSystemContext';

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
  project_count: number;
  deployed_count: number;
}

export default function RecruiterViewPage() {
  const [apiProfile, setApiProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { simulationActive, recruiterProfile: simProfile } = useLivingSystem();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/portfolio/recruiter-profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        setApiProfile({
          hiring_confidence: data.hiring_confidence,
          production_readiness: data.production_readiness,
          technical_depth: data.technical_depth,
          specialization_strength: data.specialization_strength,
          differentiation_score: data.differentiation_score,
          portfolio_maturity: data.portfolio_maturity,
          strongest_signals: data.strongest_signals || [],
          hiring_risks: data.hiring_risks || [],
          role_fit: data.role_fit || [],
          project_count: data.project_count || 0,
          deployed_count: data.deployed_count || 0,
        });
      }
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchData]);

  if (loading) return <PageContainer title="Recruiter Intelligence" subtitle="Proof-based credibility intelligence"><LoadingPulse rows={6} /></PageContainer>;

  // Resolve profile details from simulation or API
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
        project_count: 4,
        deployed_count: 3,
      }
    : apiProfile;

  if (!activeProfile) {
    return (
      <PageContainer title="Recruiter Intelligence" subtitle="Proof-based credibility intelligence">
        <EmptyState
          icon={UserCheck}
          title="No Recruiter Insights Available"
          description="Build out your skill vectors and project milestones or run the simulation workloads to audit proof-based credibility matrices."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Recruiter Intelligence"
      subtitle={simulationActive ? "Proof-based credibility intelligence (Simulation Sandbox)" : "Proof-based credibility intelligence"}
    >
      {/* Hiring Confidence Hero */}
      <GlassPanel className="border-blue-400/10 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-blue-500/[0.02] rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Hiring Confidence</p>
            <p className="text-3xl font-bold text-blue-300 transition-all duration-700">{Math.round(activeProfile.hiring_confidence * 100)}%</p>
            <p className="text-xs text-white/30 mt-1">{activeProfile.project_count} projects • {activeProfile.deployed_count} deployed</p>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-blue-400/20 text-blue-300 bg-blue-500/[0.06] capitalize">{activeProfile.portfolio_maturity.replace(/_/g, ' ')}</span>
        </div>
      </GlassPanel>

      {/* Key Metrics */}
      <DashboardGrid cols={4}>
        <MetricCard label="Production Readiness" value={`${Math.round(activeProfile.production_readiness * 100)}%`} icon={Shield} />
        <MetricCard label="Technical Depth" value={`${Math.round(activeProfile.technical_depth * 100)}%`} icon={Target} />
        <MetricCard label="Specialization" value={`${Math.round(activeProfile.specialization_strength * 100)}%`} icon={Award} />
        <MetricCard label="Differentiation" value={`${Math.round(activeProfile.differentiation_score * 100)}%`} icon={TrendingUp} />
      </DashboardGrid>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Strongest Signals */}
        <GlassPanel>
          <SectionLabel>Strongest Signals</SectionLabel>
          <div className="space-y-1.5">
            {activeProfile.strongest_signals.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50 py-1 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 mt-1 flex-shrink-0" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Hiring Risks */}
        <GlassPanel>
          <SectionLabel>Hiring Risks</SectionLabel>
          <div className="space-y-1.5">
            {activeProfile.hiring_risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/50 py-1 leading-relaxed">
                <AlertTriangle size={11} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Role Fit Matrix */}
      {activeProfile.role_fit.length > 0 && (
        <WorkspaceCard>
          <SectionLabel>Role Fit Matrix</SectionLabel>
          <div className="space-y-3">
            {activeProfile.role_fit.map((role, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.01] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white/70">{role.role}</span>
                  <span className="text-xs font-bold text-blue-300 transition-all duration-700">{Math.round(role.proof_adjusted * 100)}%</span>
                </div>
                <div className="flex gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] text-white/25">Skill Readiness</p>
                      <p className="text-[9px] text-white/40">{Math.round(role.skill_readiness * 100)}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400/60 transition-all duration-1000" style={{ width: `${role.skill_readiness * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] text-white/25">Proof Adjusted</p>
                      <p className="text-[9px] text-white/40">{Math.round(role.proof_adjusted * 100)}%</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-violet-400/60 transition-all duration-1000" style={{ width: `${role.proof_adjusted * 100}%` }} />
                    </div>
                  </div>
                </div>
                {role.missing.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[9px] text-white/20 mr-1 self-center">Missing:</span>
                    {role.missing.map((m, j) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-white/35 bg-white/[0.02]">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[9px] text-emerald-400/70 font-medium mt-2">✓ No critical missing requirements detected for this role.</div>
                )}
              </div>
            ))}
          </div>
        </WorkspaceCard>
      )}
    </PageContainer>
  );
}
