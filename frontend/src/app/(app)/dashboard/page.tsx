/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { PageContainer, WorkspaceCard } from '@/components/workspace';
import { CareerSnapshot } from '@/components/dashboard/CareerSnapshot';
import { CurrentFocus } from '@/components/dashboard/CurrentFocus';
import { TopOpportunity } from '@/components/dashboard/TopOpportunity';
import { MarketMovement } from '@/components/dashboard/MarketMovement';
import { AIInsight } from '@/components/dashboard/AIInsight';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { Compass, ChevronRight, Sparkles, FileText } from 'lucide-react';
import { fetchDashboardData, type Recommendation, type MarketRadar, type MarketSnapshot } from '@/lib/intelligence-client';
import type { Milestone } from '@/types/dashboard';

export default function DashboardPage() {
  const {
    metrics,
    roadmap,
    recruiterProfile: simProfile,
    activePersona,
    simulationActive,
    hasStrategicProfile,
  } = useLivingSystem();

  const [loading, setLoading] = useState(true);
  const [apiFocus, setApiFocus] = useState<any>(null);
  const [apiOpportunities, setApiOpportunities] = useState<any[]>([]);
  const [apiRoadmap, setApiRoadmap] = useState<any>(null);
  const [apiGaps, setApiGaps] = useState<any[]>([]);
  const [apiRecommendations, setApiRecommendations] = useState<Recommendation[]>([]);
  const [apiRadar, setApiRadar] = useState<MarketRadar | null>(null);
  const [apiMarket, setApiMarket] = useState<MarketSnapshot | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const fetchData = useCallback(async () => {
    if (simulationActive) {
      setLoading(false);
      return;
    }
    try {
      const { focus, matches, roadmapState, gaps, recommendations, radar, marketSnapshot } = await fetchDashboardData();
      if (focus.status === 'fulfilled' && focus.value) setApiFocus(focus.value);
      if (matches.status === 'fulfilled' && matches.value) setApiOpportunities(matches.value.matches || []);
      if (roadmapState.status === 'fulfilled' && roadmapState.value) setApiRoadmap(roadmapState.value);
      if (gaps.status === 'fulfilled' && gaps.value) setApiGaps(gaps.value.gaps || []);
      if (recommendations.status === 'fulfilled' && recommendations.value) {
        setApiRecommendations(recommendations.value.recommendations || []);
      }
      if (radar.status === 'fulfilled' && radar.value) setApiRadar(radar.value);
      if (marketSnapshot.status === 'fulfilled' && marketSnapshot.value) {
        setApiMarket(marketSnapshot.value);
      }
      setFetchError(
        focus.status === 'rejected' &&
        matches.status === 'rejected' &&
        roadmapState.status === 'rejected'
      );
    } catch (e) {
      console.error("Dashboard fetching error", e);
      setFetchError(true);
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
    : (dominantReadiness.matched_core || []);

  const displayGaps = simulationActive
    ? activePersona.weakestSkills
    : (dominantReadiness.missing_core || []);

  const displayMilestone = simulationActive
    ? roadmap.find((node) => node.status === 'active')
    : (apiRoadmap?.state?.snapshot?.milestones?.find((n: Milestone) => n.status === 'active') || apiRoadmap?.state?.snapshot?.milestones?.[0]);

  const displayOpportunities = simulationActive
    ? activePersona.opportunities.map((opp) => ({
        title: opp.title,
        company: opp.company,
        alignment_score: opp.alignmentScore,
        confidence: opp.confidence,
      }))
    : apiOpportunities;

  const showDashboardGrid = simulationActive || hasStrategicProfile;

  const topRecommendation = simulationActive
    ? null
    : apiRecommendations[0];

  const marketDemandDirection = simulationActive
    ? `${activePersona.marketIntel.title} ↑ ${activePersona.marketIntel.growthRate}`
    : apiRadar?.high_roi_skills?.[0]
      ? `${apiRadar.high_roi_skills[0].skill} ↑ ${apiRadar.high_roi_skills[0].trend === 'rising' ? 'High Growth' : 'Stable Demand'}`
      : apiMarket?.roi_skills?.[0]
        ? `${apiMarket.roi_skills[0].skill} ↑ ${apiMarket.roi_skills[0].trend === 'rising' ? 'High Growth' : 'Stable Demand'}`
        : apiMarket?.status === 'pending'
          ? 'Market data pending calibration'
          : 'No market data yet';

  const trendingSkills = simulationActive
    ? activePersona.strongestSkills.slice(0, 3)
    : apiRadar?.high_roi_skills?.slice(0, 3).map((s) => s.skill)
      || apiMarket?.skill_demand?.slice(0, 3).map((s) => s.skill)
      || [];

  const hasRealProfile = simulationActive || hasStrategicProfile || (
    apiFocus?.focus?.trajectory?.competitiveness_score > 0
  );

  if (loading) {
    return (
      <PageContainer title="Career Command Center" subtitle="Accessing your Skillyn credentials...">
        <DashboardSkeleton />
      </PageContainer>
    );
  }

  if (!hasRealProfile) {
    return (
      <PageContainer
        title="Welcome to Skillyn"
        subtitle="Set up your profile to track your learning goals and job recommendations."
      >
        <div className="max-w-3xl mx-auto my-10 space-y-8 animate-fade-in">
          <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Getting Started with Skillyn</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Skillyn matches your technical skills against job requirements. Follow the checklist below to get started.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "1. Upload Resume",
                desc: "Upload your resume PDF to import your skills and experience.",
                link: "/resumes",
                actionText: "Upload PDF",
              },
              {
                title: "2. Update Profile Details",
                desc: "Refine your target role, years of experience, and specialization track.",
                link: "/profile",
                actionText: "Configure Profile",
              },
              {
                title: "3. Create Learning Roadmap",
                desc: "Create a milestone path to learn missing skills.",
                link: "/roadmap-v2",
                actionText: "Check Roadmap",
              },
              {
                title: "4. Find Matching Jobs",
                desc: "View matching job postings and salary estimates.",
                link: "/opportunities",
                actionText: "Find Matches",
              }
            ].map((step, idx) => (
              <WorkspaceCard key={idx} className="p-5 border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between h-44">
                <div>
                  <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans font-normal">
                    {step.desc}
                  </p>
                </div>
                <Link
                  href={step.link}
                  className="inline-flex items-center gap-1 mt-4 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-black text-[10px] font-bold rounded transition-colors w-fit"
                >
                  {step.actionText} <ChevronRight size={10} />
                </Link>
              </WorkspaceCard>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Career Command Center" subtitle={`Overview for ${displayTargetRole}`}>
      {fetchError && (
        <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
          Some dashboard data could not be loaded.{' '}
          <button type="button" onClick={() => { setLoading(true); fetchData(); }} className="underline">
            Retry
          </button>
        </div>
      )}
      {/* Partial data notice for real profiles */}
      {!simulationActive && hasStrategicProfile && !apiRoadmap && (
        <DashboardEmptyState
          missingResume={false}
          missingRoadmap
          missingOpportunities={displayOpportunities.length === 0}
        />
      )}

      {/* Main Dashboard when data is available */}
      {showDashboardGrid && (
        <div className="space-y-8 animate-fade-in">
          {/* Section 1 – Career Snapshot */}
          <CareerSnapshot
            matchScore={Math.round(displayMetrics.matchScore)}
            profileStrength={Math.round(displayMetrics.recruiterConfidence)}
            careerGoal={displayTargetRole}
            resumeStatus={hasRealProfile ? 'Verified Resume Uploaded' : 'No Resume'}
          />

          {/* Section 2 – Current Focus */}
          <CurrentFocus
            milestone={displayMilestone}
            topGap={displayGaps[0]}
            progressText={displayMilestone?.progress ? `${displayMilestone.progress}%` : ''}
            onViewRoadmap={() => (window.location.href = '/roadmap-v2')}
          />

          {/* Section 3 – Top Opportunity */}
          <TopOpportunity
            opportunity={displayOpportunities[0]}
            onViewOpportunities={() => (window.location.href = '/opportunities')}
          />

          {/* Section 4 – Market Movement */}
          <MarketMovement
            trendingSkills={trendingSkills}
            demandDirection={marketDemandDirection}
            onViewMarket={() => (window.location.href = '/market-intelligence')}
          />

          {/* Section 5 – AI Insight */}
          <AIInsight
            insight={topRecommendation?.title}
            onAskAI={() => (window.location.href = '/workspace')}
          />
        </div>
      )}
    </PageContainer>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Career Snapshot Skeleton */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
        <div className="h-6 w-48 bg-white/10 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.04] space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded" />
              <div className="h-8 w-24 bg-white/20 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Focus & Top Opp Double Column Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/[0.04] rounded" />
          <div className="h-4 w-2/3 bg-white/[0.04] rounded" />
          <div className="h-10 w-full bg-white/10 rounded mt-4" />
        </div>
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <div className="h-6 w-36 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/[0.04] rounded" />
          <div className="h-4 w-5/6 bg-white/[0.04] rounded" />
          <div className="h-10 w-full bg-white/10 rounded mt-4" />
        </div>
      </div>

      {/* Market & AI insights Skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="col-span-2 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
          <div className="h-6 w-40 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/[0.04] rounded" />
          <div className="h-4 w-full bg-white/[0.04] rounded" />
        </div>
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-6 w-24 bg-white/10 rounded" />
            <div className="h-4 w-full bg-white/[0.04] rounded" />
          </div>
          <div className="h-10 w-full bg-white/10 rounded mt-4" />
        </div>
      </div>
    </div>
  );
}
