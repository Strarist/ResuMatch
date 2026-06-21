'use client';

import React from 'react';
import { Target, CheckCircle2, Circle, Star, ArrowUpRight, Compass, Layers, ShieldCheck } from 'lucide-react';

export default function DashboardV4() {
  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#020617]/80 backdrop-blur-2xl p-6 shadow-2xl space-y-6 font-sans select-none pointer-events-none relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Header Info */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            JD
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Jane Doe</h3>
            <span className="text-[10px] text-slate-500 mt-1 block uppercase tracking-wider font-semibold">Active Candidate Profile</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck size={12} />
          <span className="text-[9px] uppercase font-bold tracking-widest font-mono">Profile Verified</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-4 sm:grid-cols-2 relative z-10">

        {/* 1. Overview & completeness */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers size={13} className="text-slate-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Candidate Scorecard</span>
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-white">Lead Systems Architect</h4>
            <span className="text-[11px] text-slate-400 block mt-0.5">Specialization: High-Performance Platform Runtimes</span>
          </div>
          <div className="pt-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-semibold">
              <span>Profile Completeness</span>
              <span className="text-white font-mono">85%</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        {/* 2. Target Market Demand Indicator */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Target size={13} className="text-slate-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Market Competitiveness</span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl font-extrabold text-white font-mono">92.4</span>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">+4.2%</span>
          </div>
          <span className="text-[10px] text-slate-500 leading-normal">Your verified Go and Kubernetes skills exceed 92% of market candidates.</span>
        </div>

      </div>

      {/* 3. Upskilling Career Roadmap */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 space-y-3 relative z-10">
        <div className="flex items-center gap-2 text-slate-400">
          <Compass size={13} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Active Upskilling Roadmap</span>
        </div>
        <div className="space-y-2.5">
          {[
            { skill: 'Kubernetes Operator Design & Reconciliation', sprint: 'Sprint 1', status: 'completed' },
            { skill: 'Distributed Caching & Redis Clustering', sprint: 'Sprint 2', status: 'active' },
            { skill: 'gRPC schema generation & Protobuf APIs', sprint: 'Sprint 3', status: 'pending' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-white/[0.04]">
              <div className="flex items-center gap-3">
                {item.status === 'completed' ? (
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                ) : item.status === 'active' ? (
                  <Circle size={14} className="text-amber-400 flex-shrink-0" />
                ) : (
                  <Circle size={14} className="text-slate-600 flex-shrink-0" />
                )}
                <span className={`text-[12px] font-medium leading-none ${item.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {item.skill}
                </span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${item.status === 'completed' ? 'bg-slate-800 text-slate-600' : item.status === 'active' ? 'bg-amber-900/20 text-amber-400 border border-amber-500/20' : 'bg-slate-900 text-slate-600'}`}>
                {item.sprint}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Best Opportunities Match Scorecard */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 space-y-3 relative z-10">
        <div className="flex items-center gap-2 text-slate-400">
          <Star size={13} className="text-slate-400" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Top Matched Opportunities</span>
        </div>
        <div className="grid gap-2">
          {[
            { company: 'Vercel', title: 'Staff Platform Architect', match: '96% Fit', comp: '$190,000 - $240,000' },
            { company: 'Stripe', title: 'Senior Distributed Lead', match: '91% Fit', comp: '$180,000 - $220,000' },
          ].map((job, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white">{job.company}</span>
                  <span className="text-[9px] text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400">{job.title}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono font-bold tracking-wider">{job.comp}</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1 text-emerald-400 font-bold font-mono text-[10px]">
                {job.match}
                <ArrowUpRight size={10} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
