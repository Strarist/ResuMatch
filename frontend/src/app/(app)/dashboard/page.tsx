/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLivingSystem } from '@/context/LivingSystemContext';
import {
  PageContainer,
  DashboardGrid,
  MetricCard,
  SectionLabel,
  WorkspaceCard,
} from '@/components/workspace';
import {
  Target,
  Compass,
  Globe,
  Award,
  ChevronRight,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { env } from '@/lib/env';

export default function DashboardPage() {
  const {
    metrics,
    roadmap,
    recruiterProfile: simProfile,
    activePersona,
    simulationActive,
  } = useLivingSystem();

  const [loading, setLoading] = useState(true);
  const [apiFocus, setApiFocus] = useState<any>(null);
  const [apiOpportunities, setApiOpportunities] = useState<any[]>([]);
  const [apiRoadmap, setApiRoadmap] = useState<any>(null);
  const [apiGaps, setApiGaps] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (simulationActive) {
      setLoading(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [focusRes, oppsRes, roadmapRes, gapsRes] = await Promise.allSettled([
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/strategic/focus`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/matches`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/state`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${env.NEXT_PUBLIC_API_URL}/v1/opportunities/gaps`, { headers }).then(res => res.ok ? res.json() : null),
      ]);
      
      if (focusRes.status === 'fulfilled' && focusRes.value) setApiFocus(focusRes.value);
      if (oppsRes.status === 'fulfilled' && oppsRes.value) setApiOpportunities(oppsRes.value.matches || []);
      if (roadmapRes.status === 'fulfilled' && roadmapRes.value) setApiRoadmap(roadmapRes.value);
      if (gapsRes.status === 'fulfilled' && gapsRes.value) setApiGaps(gapsRes.value.gaps || []);
    } catch (e) {
      console.error("Dashboard fetching error", e);
    }
    setLoading(false);
  }, [simulationActive]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Resolve metrics dynamically
  const displayMetrics = simulationActive ? metrics : {
    matchScore: apiFocus?.focus?.execution_profile?.growth_velocity ? (apiFocus.focus.execution_profile.growth_velocity * 100) : (metrics.matchScore || 0),
    recruiterConfidence: apiFocus?.focus?.risks?.risk_score ? (100 - apiFocus.focus.risks.risk_score) : (metrics.recruiterConfidence || 0),
    marketFit: apiFocus?.focus?.market?.market_alignment ? apiFocus.focus.market.market_alignment : (metrics.marketFit || 0),
    careerVelocity: apiFocus?.focus?.execution_profile?.growth_velocity ? (apiFocus.focus.execution_profile.growth_velocity * 100) : (metrics.careerVelocity || 0)
  };

  const displaySpecialization = simulationActive 
    ? activePersona.specialization 
    : (apiFocus?.focus?.trajectory?.dominant_path ? `${apiFocus.focus.trajectory.dominant_path} Engineering` : activePersona.specialization);

  const displayTargetRole = simulationActive 
    ? activePersona.targetRole 
    : (apiFocus?.focus?.trajectory?.dominant_path ? `Senior ${apiFocus.focus.trajectory.dominant_path} Specialist` : activePersona.targetRole);

  const dominantPath = apiFocus?.focus?.trajectory?.dominant_path || "Software Engineer";
  const dominantReadiness = apiFocus?.focus?.trajectory?.readiness_scores?.[dominantPath] || {};

  const displayValidatedSkills = simulationActive 
    ? activePersona.strongestSkills 
    : (dominantReadiness.matched_core || ["Python", "FastAPI", "React"]);

  const displayGaps = simulationActive 
    ? activePersona.weakestSkills 
    : (dominantReadiness.missing_core || ["Kubernetes", "Redis"]);

  const displayMilestone = simulationActive
    ? roadmap.find((node) => node.status === 'active')
    : (apiRoadmap?.state?.snapshot?.milestones?.find((n: any) => n.status === 'active') || apiRoadmap?.state?.snapshot?.milestones?.[0]);

  const displayOpportunities = simulationActive ? activePersona.opportunities : apiOpportunities;

  // AI coach action chips based on specialization
  const getAiRecommendations = () => {
    if (displaySpecialization.toLowerCase().includes('ai')) {
      return [
        { title: "Optimize GPU pipeline memory layouts", desc: "Build a cuda-benchmark project proving distributed GPU inference knowledge." },
        { title: "Bridge vLLM container orchestration limits", desc: "Write an active roadmap project verifying multi-node cluster configurations." }
      ];
    }
    return [
      { title: "Build a Redis-backed notification system", desc: "Validate distributed caching and queue engineering benchmarks." },
      { title: "Write an Infrastructure-as-Code Terraform script", desc: "Verify secure container networking policies for AWS clusters." }
    ];
  };

  return (
    <PageContainer
      title="Today's Career Command Center"
      subtitle={`Upskilling, matched opportunities, and coach strategies calibrated for: ${displayTargetRole}`}
    >
      <div className="space-y-6 animate-fade-in">
        
        {/* TOP SECTION: Consolidated Profile Metrics & Skills */}
        <section className="grid md:grid-cols-12 gap-6">
          {/* Main Stat Cards (8 cols) */}
          <div className="md:col-span-8 grid grid-cols-2 gap-4">
            <MetricCard
              label="Hiring Readiness Score"
              value={`${Math.round(displayMetrics.matchScore)}%`}
              icon={Target}
            />
            <MetricCard
              label="Recruiter Alignment Index"
              value={`${Math.round(displayMetrics.recruiterConfidence)}%`}
              icon={Award}
            />
            <MetricCard
              label="Market Fit Index"
              value={`${Math.round(displayMetrics.marketFit)}%`}
              icon={Globe}
            />
            <MetricCard
              label="Execution Velocity"
              value={`${Math.round(displayMetrics.careerVelocity)}%`}
              icon={TrendingUp}
            />
          </div>

          {/* Verified Technical Skills Panel (4 cols) */}
          <WorkspaceCard className="md:col-span-4 flex flex-col justify-between border border-white/[0.04] bg-white/[0.01]">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase block mb-2">Verified Core Skills</span>
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                {displayValidatedSkills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/[0.05] border border-emerald-500/20 text-emerald-300 font-mono font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/resumes"
              className="mt-3 text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-0.5"
            >
              Update Resume <ChevronRight size={10} />
            </Link>
          </WorkspaceCard>
        </section>

        {/* MIDDLE SECTION: Current Roadmap, Top Opportunities, & Gaps */}
        <section className="grid lg:grid-cols-12 gap-6">
          
          {/* 1. Current Roadmap Milestone Sprint (5 cols) */}
          <WorkspaceCard className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-blue-400" />
                  <SectionLabel>Active Upskilling Goal</SectionLabel>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono uppercase font-bold">Active</span>
              </div>

              {displayMilestone ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">{displayMilestone.skill || displayMilestone.title}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Estimated effort: {displayMilestone.effortWeeks || displayMilestone.effort_weeks || 4} weeks
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans font-normal">
                    {displayMilestone.strategicRationale || displayMilestone.reason || displayMilestone.strategic_rationale}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No active milestone target selected. Complete or configure targets on your Roadmap.</p>
              )}
            </div>

            <Link
              href="/roadmap-v2"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-black text-[11px] font-bold rounded-lg transition-colors w-fit"
            >
              Bridge Skill Gap <ChevronRight size={12} />
            </Link>
          </WorkspaceCard>

          {/* 2. Top Job Matches (4 cols) */}
          <WorkspaceCard className="lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={14} className="text-purple-400" />
                <SectionLabel>Top Target Opportunities</SectionLabel>
              </div>

              <div className="space-y-2">
                {displayOpportunities.slice(0, 2).map((opp: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#080c14] border border-white/[0.02] flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-semibold text-white truncate">{opp.title}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{opp.company} • {opp.compensation || "$140k–$180k"}</p>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-400 font-mono">
                      {opp.alignmentScore ? Math.round(opp.alignmentScore * 100) : 85}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/opportunities"
              className="mt-4 text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-0.5"
            >
              Analyze Opportunities <ChevronRight size={10} />
            </Link>
          </WorkspaceCard>

          {/* 3. Skill Deficits / Gaps (3 cols) */}
          <WorkspaceCard className="lg:col-span-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} className="text-amber-500" />
                <SectionLabel>Outstanding Gaps</SectionLabel>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto">
                {displayGaps.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No remaining skill gaps!</span>
                ) : (
                  displayGaps.map((gap: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-[9px] px-2 py-0.5 rounded bg-amber-500/[0.05] border border-amber-500/20 text-amber-300 font-mono font-medium"
                    >
                      {gap}
                    </span>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/market-intelligence"
              className="mt-4 text-[10px] text-slate-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-0.5"
            >
              Check Salary Impact <ChevronRight size={10} />
            </Link>
          </WorkspaceCard>
        </section>

        {/* BOTTOM SECTION: AI Coach Suggestions & Upskilling Timeline */}
        <section className="grid lg:grid-cols-12 gap-6">
          
          {/* AI Suggested Portfolio Projects (8 cols) */}
          <WorkspaceCard className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={14} className="text-amber-400" />
              <SectionLabel>AI Coach — Portfolio Projects</SectionLabel>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {getAiRecommendations().map((rec, idx) => (
                <div key={idx} className="p-3 bg-white/[0.005] border border-white/[0.03] rounded-lg flex flex-col justify-between h-28">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-amber-400" /> {rec.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      {rec.desc}
                    </p>
                  </div>
                  <Link
                    href="/workspace"
                    className="text-[9px] text-blue-400 hover:underline font-bold uppercase tracking-wider flex items-center gap-0.5"
                  >
                    Draft Spec in Coach <ChevronRight size={10} />
                  </Link>
                </div>
              ))}
            </div>
          </WorkspaceCard>

          {/* Recent Upskilling Timeline (4 cols) */}
          <WorkspaceCard className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <SectionLabel>Recent Progress</SectionLabel>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Uploaded Ingest Portfolio</p>
                  <p className="text-[10px] text-slate-500">Skills calibrated successfully</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-white/80 font-medium">Roadmap Calibrated</p>
                  <p className="text-[10px] text-slate-500">Active milestone targeted</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-white/40 font-medium">Job Matches Refreshed</p>
                  <p className="text-[10px] text-slate-500">Opportunities updated based on skills</p>
                </div>
              </div>
            </div>
          </WorkspaceCard>

        </section>

      </div>
    </PageContainer>
  );
}
