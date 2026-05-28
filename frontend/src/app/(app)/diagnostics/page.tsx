'use client';

import React from 'react';
import Link from 'next/link';
import { PageContainer, WorkspaceCard, SectionLabel } from '@/components/workspace';
import { Shield, Activity, GitMerge, ChevronRight, Lock } from 'lucide-react';

export default function DiagnosticsPage() {
  return (
    <PageContainer
      title="System Diagnostics Console"
      subtitle="Manual administrative tools and runtime engineering workspace monitors"
    >
      <div className="space-y-6">
        {/* Intro notice banner */}
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.02] flex items-start gap-4">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 mt-0.5">
            <Lock size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white mb-0.5">Isolate Diagnostic Scope</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This panel is restricted exclusively to development teams. These systems monitor telemetry, test runtime fault tolerances, and verify system state synchronization. Normal career platform users do not have access to these views from standard navigation.
            </p>
          </div>
        </div>

        {/* Administrative cards grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Observability */}
          <WorkspaceCard className="flex flex-col justify-between h-48 border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-blue-400" />
                <SectionLabel>Runtime Observability</SectionLabel>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                Inspect live database telemetry stream logs, analyze drift warnings, audit pipeline events, and view active database integrity scores.
              </p>
            </div>
            <Link
              href="/observability"
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
            >
              Access Monitor <ChevronRight size={12} />
            </Link>
          </WorkspaceCard>

          {/* Card 2: Resilience */}
          <WorkspaceCard className="flex flex-col justify-between h-48 border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-rose-400 animate-pulse" />
                <SectionLabel>Resilience Chaos Lab</SectionLabel>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                Validate platform self-healing behaviors, run rate-limiting simulations, and trigger mock database failures to test failover contingencies.
              </p>
            </div>
            <Link
              href="/resilience"
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider"
            >
              Access Lab <ChevronRight size={12} />
            </Link>
          </WorkspaceCard>

          {/* Card 3: Convergence */}
          <WorkspaceCard className="flex flex-col justify-between h-48 border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitMerge size={16} className="text-emerald-400" />
                <SectionLabel>Pipeline Convergence</SectionLabel>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                Analyze pipeline synchronization logs, compress historical telemetry event lists, and inspect raw database compression statistics.
              </p>
            </div>
            <Link
              href="/convergence"
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
            >
              Access Engine <ChevronRight size={12} />
            </Link>
          </WorkspaceCard>
        </div>
      </div>
    </PageContainer>
  );
}
