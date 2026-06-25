"use client";

import React from 'react';
import { Target, TrendingUp, Sparkles, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { useLivingSystem } from '@/context/LivingSystemContext';

export function StrategicStateBanner() {
  const { activePersona, lifecycleStage } = useLivingSystem();

  const getTitle = () => {
    switch (lifecycleStage) {
      case 1:
        return 'Trajectory Calibrating';
      case 2:
        return 'Analyzing Career Signals';
      case 3:
        return 'Trajectory Active';
      case 4:
        return 'Trajectory Optimized';
      default:
        return 'Strategic Trajectory';
    }
  };

  const getStatusIcon = () => {
    switch (lifecycleStage) {
      case 1:
        return <AlertTriangle size={18} className="text-blue-400" />;
      case 2:
        return <Loader2 size={18} className="text-amber-400 animate-spin" />;
      case 3:
        return <ShieldCheck size={18} className="text-emerald-400" />;
      case 4:
        return <Sparkles size={18} className="text-indigo-400 animate-pulse" />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />;
    }
  };

  const getDescription = () => {
    if (lifecycleStage === 1) {
      return "Career engine is standing by in onboarding mode. Ingest your resume or click simulation mode to synchronize strategic metrics.";
    }
    if (lifecycleStage === 2) {
      return "Processing resume credentials. Extracting specialization clusters and matching market demand trends.";
    }
    return `${activePersona.specialization} specialization active. Market alignment indicates strong match for ${activePersona.targetRole} pipelines.`;
  };

  const topLeverageSkill = activePersona.strongestSkills[0] || 'Awaiting Portfolio Ingestion';
  const growthRate = lifecycleStage === 1 ? 'Calibrating' : activePersona.marketIntel.growthRate;

  return (
    <div className="w-full bg-surface-raised/80 border border-border rounded-2xl p-5 shadow-md relative overflow-hidden backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-success/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-bold tracking-tight mb-1 flex items-center gap-2 text-text">
            {getStatusIcon()}
            {getTitle()}
          </h2>
          <p className="text-xs text-text-secondary max-w-lg leading-relaxed font-sans font-medium">
            {getDescription()}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-surface-inset border border-border rounded-xl p-3.5 flex flex-col justify-center min-w-[120px]">
            <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
              <TrendingUp size={12} className="text-success" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Market Demand</span>
            </div>
            <span className="text-sm font-bold text-text font-sans">{growthRate}</span>
          </div>

          <div className="bg-surface-inset border border-border rounded-xl p-3.5 flex flex-col justify-center min-w-[140px] max-w-[200px]">
            <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
              <Target size={12} className="text-accent" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Strongest Skill</span>
            </div>
            <span className="text-sm font-bold text-text truncate font-sans" title={topLeverageSkill}>
              {topLeverageSkill}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
