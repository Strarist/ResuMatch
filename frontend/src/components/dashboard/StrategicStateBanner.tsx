"use client";

import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

export function StrategicStateBanner() {
  return (
    <div className="w-full bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-medium tracking-tight mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Trajectory Accelerating
          </h2>
          <p className="text-sm text-white/50 max-w-lg">
            Platform engineering specialization stabilizing. Market alignment up +12% over the last 90 days due to consolidated proof deployments.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-black border border-white/10 rounded-xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-medium uppercase tracking-wider">Recruiter Trend</span>
            </div>
            <span className="text-lg font-semibold">Rising Fast</span>
          </div>

          <div className="bg-black border border-white/10 rounded-xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Target size={14} className="text-violet-400" />
              <span className="text-xs font-medium uppercase tracking-wider">Top Leverage</span>
            </div>
            <span className="text-lg font-semibold truncate max-w-[140px]" title="Distributed Systems Proof">Distributed Systems Proof</span>
          </div>
        </div>
      </div>
    </div>
  );
}
