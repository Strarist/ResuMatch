"use client";

import React from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { LineChart, Crosshair, ArrowUpRight, Zap, Target } from 'lucide-react';
import { Layout } from '@/components/layout/LayoutSystem';

export default function ExecutiveIntelligencePage() {
  return (
    <Layout variant="dashboard">
      <PageContainer
        title="Executive Intelligence"
        subtitle="Deep strategic analysis and trajectory forecasting"
      >
      <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">

        {/* Trajectory Forecasting */}
        <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <LineChart size={80} />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
            <LineChart size={14} /> Trajectory Forecasting
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Current Velocity leads to:</p>
              <h4 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                Staff Platform Engineer <ArrowUpRight size={16} />
              </h4>
              <p className="text-sm text-white/60 mt-1">Estimated timeframe: 14-18 months (Accelerated due to recent CI/CD deployments).</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-white/40 mb-1">Market Compensation Trend:</p>
              <h4 className="text-lg font-semibold text-white/90">$180k - $220k Range</h4>
              <p className="text-xs text-amber-400/80 mt-1">Note: Remote positioning may widen variance.</p>
            </div>
          </div>
        </div>

        {/* Compounding Leverage */}
        <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Crosshair size={80} />
          </div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
            <Zap size={14} /> Compounding Leverage
          </h3>

          <div className="bg-black border border-blue-500/30 rounded-xl p-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-sm inline-block mb-2">Highest Impact Unlock</span>
            <h4 className="text-base font-medium text-white">Publicly verify Distributed Systems architecture</h4>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 rounded px-3 py-2 border border-white/5">
                <span className="block text-white/40 mb-1">Recruiter Trust Impact</span>
                <span className="text-emerald-400 font-semibold">+18% projected</span>
              </div>
              <div className="bg-white/5 rounded px-3 py-2 border border-white/5">
                <span className="block text-white/40 mb-1">Graph Expansion</span>
                <span className="text-emerald-400 font-semibold">+12% new nodes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Bottlenecks */}
        <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-sm font-medium uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
            <Target size={14} /> Strategic Bottlenecks
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-black border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className="w-1 absolute left-0 top-0 bottom-0 bg-red-500/50" />
              <h4 className="text-sm font-medium text-white mb-2">Execution Consistency</h4>
              <p className="text-xs text-white/50">High volatility in roadmap completion is depressing recruiter readiness score by ~5%.</p>
            </div>

            <div className="bg-black border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className="w-1 absolute left-0 top-0 bottom-0 bg-amber-500/50" />
              <h4 className="text-sm font-medium text-white mb-2">Network Density</h4>
              <p className="text-xs text-white/50">Low visibility into adjacent peer clusters. Recommendation: Link LinkedIn graph.</p>
            </div>

            <div className="bg-black border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className="w-1 absolute left-0 top-0 bottom-0 bg-emerald-500/50" />
              <h4 className="text-sm font-medium text-white mb-2">System Health</h4>
              <p className="text-xs text-emerald-400/80">Adaptive engines are running optimally. Propagation confidence is high.</p>
            </div>
          </div>
        </div>

      </div>
      </PageContainer>
    </Layout>
  );
}
