'use client';

import React, { useState } from 'react';
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
  Brain,
  Target,
  Shield,
  Compass,
  Globe,
  Activity,
  FileText,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Plus,
  TrendingUp,
  Loader2,
  Sparkles,
  Clock,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    metrics,
    feed: simFeed,
    roadmap,
    recruiterProfile: simProfile,
    activePersona,
    lifecycleStage,
    setLifecycleStage,
    triggerSystemScan,
  } = useLivingSystem();

  const [scanning, setScanning] = useState(false);

  const handleInitialScan = async () => {
    setScanning(true);
    // Advance to Stage 2 (Parsing)
    setLifecycleStage(2);
    // Trigger the context scan (which takes 1.5s and advances to Stage 3)
    await triggerSystemScan();
    setScanning(false);
  };

  // Find the first active roadmap node for the Active Execution Sprint panel
  const activeMilestone = roadmap.find((node) => node.status === 'active');

  return (
    <PageContainer
      title="Strategic Command Center"
      subtitle={`Career Engine — ${activePersona.name} Trajectory`}
    >
      <div className="space-y-6">

        {/* 1. PRIMARY STRATEGIC ACTION BANNER */}
        <section className="animate-fade-in">
          {lifecycleStage === 1 && (
            <div className="p-5 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 to-slate-900/60 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 mt-1 md:mt-0 flex-shrink-0">
                  <Brain size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Action Required: Portfolio Calibration</h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    Your career optimization engine is currently running on a dormant baseline. Calibrate your profile vector to map specific skills gaps, unlock recruiter signal tracking, and match target opportunities.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Link
                  href="/resumes"
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                >
                  <Plus size={14} /> Ingest Resume
                </Link>
                <button
                  onClick={handleInitialScan}
                  disabled={scanning}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all border border-blue-500/30"
                >
                  {scanning ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Calibrating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Run Simulation Scan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {lifecycleStage === 2 && (
            <div className="p-5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-slate-900/60 backdrop-blur-md flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Stage 2: Parsing Ingested Portfolio</h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Extracting experience credentials, modeling skill taxonomy maps, and synthesizing target roadmap milestones. Please wait while the trajectory engine recalculates...
                </p>
              </div>
            </div>
          )}

          {lifecycleStage === 3 && (
            <div className="p-5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-slate-900/60 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 mt-1 md:mt-0 flex-shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Stage 3: Trajectory Calibrated</h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    System calibrated for <span className="text-white font-semibold">{activePersona.targetRole}</span>. A critical gap in <span className="text-amber-400 font-semibold">{activeMilestone?.skill || 'skills'}</span> has been detected. Bridge this gap to raise your matching rate to over 90%.
                  </p>
                </div>
              </div>
              <Link
                href="/roadmap-v2"
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-all"
              >
                Go to Roadmap <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {lifecycleStage === 4 && (
            <div className="p-5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-slate-900/60 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 mt-1 md:mt-0 flex-shrink-0">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Stage 4: Advanced Trajectory Optimized</h3>
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    AI Copilot is fully synchronized with your roadmap state. Recruiters signals are active. Ask the copilot to draft customized portfolio projects to solidify credentials.
                  </p>
                </div>
              </div>
              <Link
                href="/workspace"
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all border border-indigo-400/30"
              >
                Open AI Workspace <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>

        {/* HIGH-DENSITY METRICS SUMMARY PANEL */}
        <section className="animate-fade-in">
          <DashboardGrid cols={4}>
            <MetricCard
              label="Match Competitiveness"
              value={`${Math.round(metrics.matchScore)}%`}
              icon={Target}
            />
            <MetricCard
              label="Recruiter Confidence"
              value={`${Math.round(metrics.recruiterConfidence)}%`}
              icon={Shield}
            />
            <MetricCard
              label="Market Fit Score"
              value={`${Math.round(metrics.marketFit)}%`}
              icon={Globe}
            />
            <MetricCard
              label="Execution Velocity"
              value={`${Math.round(metrics.careerVelocity)}%`}
              icon={TrendingUp}
            />
          </DashboardGrid>
        </section>

        {/* MAIN SPLIT: TRAJECTORY & ROADMAP vs MARKET & RECRUITERS */}
        <div className="grid lg:grid-cols-12 gap-6 animate-slide-in-bottom">

          {/* LEFT COLUMN: TRAJECTORY & ROADMAP SPRINT (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* 3. CURRENT TRAJECTORY ENGINE */}
            <WorkspaceCard>
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-emerald-400" />
                <SectionLabel>Target Trajectory Map</SectionLabel>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Target Specialization</span>
                  <p className="text-sm font-semibold text-white">{activePersona.specialization}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Target Career Role</span>
                  <p className="text-sm font-semibold text-white/90">{activePersona.targetRole}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Validated Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {activePersona.strongestSkills.length === 0 ? (
                        <span className="text-[10px] text-slate-500 italic">No validated skills yet</span>
                      ) : (
                        activePersona.strongestSkills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/[0.06] border border-emerald-500/20 text-emerald-300 font-mono"
                          >
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Outstanding Gaps</span>
                    <div className="flex flex-wrap gap-1">
                      {activePersona.weakestSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] px-2 py-0.5 rounded bg-amber-500/[0.06] border border-amber-500/20 text-amber-300 font-mono"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </WorkspaceCard>

            {/* 4. ACTIVE EXECUTION SPRINT */}
            <WorkspaceCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-blue-400" />
                  <SectionLabel>Active Execution Sprint</SectionLabel>
                </div>
                <Link
                  href="/roadmap-v2"
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  Configure Roadmap <ChevronRight size={10} />
                </Link>
              </div>

              {activeMilestone ? (
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">{activeMilestone.skill}</h4>
                      <div className="flex gap-2 items-center text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1"><Clock size={10} /> {activeMilestone.effortWeeks} Weeks Effort</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">Priority: {activeMilestone.priority.toUpperCase()}</span>
                      </div>
                    </div>
                    {activeMilestone.completionConfidence && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Completion Confidence</span>
                        <span className="text-xs font-bold text-emerald-400">{activeMilestone.completionConfidence}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block mb-0.5">Strategic Rationale</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{activeMilestone.strategicRationale || activeMilestone.reason}</p>
                  </div>
                  {activeMilestone.projectedImpact && (
                    <div className="pt-1.5 border-t border-white/[0.02] flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">Projected Value:</span>
                      <span className="text-white font-medium">{activeMilestone.projectedImpact}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.005] border border-white/[0.03] text-center">
                  <p className="text-xs text-slate-500 italic">No active milestones. Complete or select milestones in the Roadmap tab.</p>
                </div>
              )}
            </WorkspaceCard>

          </div>

          {/* RIGHT COLUMN: MARKET MOVEMENT & RECRUITER SIGNALS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* 2. MARKET MOVEMENT */}
            <WorkspaceCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-indigo-400" />
                  <SectionLabel>Market Movement</SectionLabel>
                </div>
                <Link
                  href="/market-intelligence"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  Intel Details <ChevronRight size={10} />
                </Link>
              </div>

              <div className="space-y-4 font-mono text-[10px]">
                <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Specialization:</span>
                    <span className="text-white font-bold">{activePersona.marketIntel.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salary Trajectory:</span>
                    <span className="text-emerald-400 font-bold">{activePersona.marketIntel.salaryRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Market Growth:</span>
                    <span className="text-white font-bold">{activePersona.marketIntel.growthRate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/[0.02]">
                    <span className="text-slate-500">Recruiter Pressure:</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                      activePersona.opportunities[0]?.recruiterPressure === 'high'
                        ? 'border-red-500/20 text-red-400 bg-red-500/[0.04]'
                        : 'border-amber-500/20 text-amber-400 bg-amber-500/[0.04]'
                    }`}>
                      {activePersona.opportunities[0]?.recruiterPressure || 'Medium'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block mb-2">Causal Market Signals</span>
                  <div className="text-slate-400 font-sans text-xs leading-relaxed">
                    {activePersona.marketIntel.description}
                  </div>
                </div>
              </div>
            </WorkspaceCard>

            {/* 5. RECRUITER SIGNALS */}
            <WorkspaceCard>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-emerald-400" />
                <SectionLabel>Recruiter Signals</SectionLabel>
              </div>

              {lifecycleStage === 1 ? (
                <div className="p-6 border border-white/[0.04] bg-white/[0.005] rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                  <Lock size={18} className="text-slate-600" />
                  <p className="text-xs text-slate-500 font-medium">Recruiter metrics locked</p>
                  <p className="text-[10px] text-slate-600 max-w-[200px]">Ingest a resume to model signals and validate capabilities.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {simProfile && (
                    <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                      <div className="p-2 bg-slate-950 border border-white/[0.03] rounded">
                        <span className="text-slate-500 block mb-0.5">Hiring Score</span>
                        <span className="text-xs font-bold text-white">{Math.round(simProfile.hiringConfidence * 100)}%</span>
                      </div>
                      <div className="p-2 bg-slate-950 border border-white/[0.03] rounded">
                        <span className="text-slate-500 block mb-0.5">Readiness</span>
                        <span className="text-xs font-bold text-white">{Math.round(simProfile.productionReadiness * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {simProfile && simProfile.strongestSignals && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Strongest Recruiter Matches</span>
                      <div className="space-y-1.5">
                        {simProfile.strongestSignals.slice(0, 2).map((sig, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-1.5 text-xs text-slate-400 leading-normal">
                            <span className="w-1 h-1 rounded-full bg-emerald-400/60 mt-1.5 flex-shrink-0" />
                            <span>{sig}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {simProfile && simProfile.hiringRisks && simProfile.hiringRisks.length > 0 && (
                    <div className="space-y-2 border-t border-white/[0.03] pt-3">
                      <span className="text-[9px] font-mono text-amber-500/70 uppercase block">Risks Identified</span>
                      <div className="space-y-1.5">
                        {simProfile.hiringRisks.slice(0, 2).map((risk, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-1.5 text-xs text-slate-400 leading-normal">
                            <AlertTriangle size={11} className="text-amber-500/60 mt-0.5 flex-shrink-0" />
                            <span>{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </WorkspaceCard>

          </div>

        </div>

        {/* 6. SUPPORTING TELEMETRY (EVENTS AUDIT FEED & RESUMES) */}
        <section className="grid lg:grid-cols-12 gap-6 animate-slide-in-bottom">

          {/* Active Resumes (4 cols) */}
          <WorkspaceCard className="lg:col-span-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <SectionLabel>Portfolio Source Files</SectionLabel>
              </div>
              <Link
                href="/resumes"
                className="text-[10px] text-slate-400 hover:text-slate-200 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                Upload <ChevronRight size={10} />
              </Link>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {lifecycleStage === 1 ? (
                <div className="p-3 border border-dashed border-white/[0.06] bg-white/[0.002] rounded-lg text-center">
                  <p className="text-[10px] text-slate-500 mb-2">No files currently parsing</p>
                  <Link
                    href="/resumes"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-black text-[9px] font-bold transition-all"
                  >
                    <Plus size={10} /> Ingest Resume
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-slate-900 border border-white/[0.03] text-xs">
                  <FileText size={14} className="text-emerald-400/60 flex-shrink-0" />
                  <span className="truncate flex-1 text-white/70">Ingested_Portfolio_Credentials.pdf</span>
                </div>
              )}
            </div>
          </WorkspaceCard>

          {/* System Telemetry Audit Feed (8 cols) */}
          <WorkspaceCard className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-rose-400" />
                <SectionLabel>Telemetry Audit Feed</SectionLabel>
              </div>
              <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">
                Active Audit Stream
              </span>
            </div>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {simFeed.slice(0, 4).map((item, idx) => (
                <div key={idx} className="relative pl-3.5 border-l border-white/[0.08] text-xs">
                  <span className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-slate-900 border border-blue-500" />
                  <div className="flex items-center justify-between font-medium mb-0.5">
                    <span className="capitalize text-slate-300 font-mono text-[10px]">{item.source} • {item.eventType}</span>
                    <span className="text-[9px] text-slate-500">{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{item.message}</p>
                </div>
              ))}
            </div>
          </WorkspaceCard>

        </section>

      </div>
    </PageContainer>
  );
}
