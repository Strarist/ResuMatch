'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';

interface ReadinessScore {
  score: number;
  matched_core: string[];
  missing_core: string[];
  confidence: number;
}

interface Specialization {
  strength: number;
  skills: string[];
  momentum: number;
  emerging: boolean;
  dominant: boolean;
}

interface AdjacentRole {
  role: string;
  readiness: number;
  gap_skills: string[];
}

interface TrajectoryData {
  dominant_path: string;
  secondary_paths: string[];
  readiness_scores: Record<string, ReadinessScore>;
  specializations: Record<string, Specialization>;
  adjacent_roles: AdjacentRole[];
  competitiveness_score: number;
  drift_detected: boolean;
  drift_details: string | null;
  confidence: number;
}

export default function TrajectoryPage() {
  const [apiData, setApiData] = useState<TrajectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { simulationActive, metrics, recruiterProfile } = useLivingSystem();

  const fetchTrajectory = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/trajectory/snapshot`, { headers });
      if (res.ok) setApiData(await res.json());
    } catch { /* non-critical */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!simulationActive) {
      fetchTrajectory();
    } else {
      setLoading(false);
    }
  }, [simulationActive, fetchTrajectory]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>;
  }

  // Resolve active data
  const data: TrajectoryData | null = simulationActive
    ? {
        dominant_path: 'AI & Distributed Systems Platform Infrastructure',
        secondary_paths: ['High-Performance Computing', 'Rust Infrastructure Dev'],
        readiness_scores: {
          'AI Platform Architect': { score: metrics.matchScore / 100, matched_core: ['Distributed systems architecture', 'GPU networks'], missing_core: ['CUDA optimization tuning'], confidence: 0.92 },
          'Staff Systems Engineer': { score: Math.max(0.1, (metrics.matchScore - 5) / 100), matched_core: ['Rust core systems', 'High-throughput brokers'], missing_core: ['Raft/Paxos consensus design'], confidence: 0.88 },
          'Senior Core Backend Engineer': { score: 0.96, matched_core: ['TypeScript systems', 'Database tuning', 'Docker orchestration'], missing_core: [], confidence: 0.95 },
        },
        specializations: {
          'GPU & Parallel Compute': { strength: recruiterProfile?.productionReadiness || 0.92, skills: ['CUDA Kernels', 'TensorRT compilers', 'Hardware binding analytics'], momentum: 1, emerging: true, dominant: false },
          'Distributed Protocols': { strength: recruiterProfile?.specializationStrength || 0.89, skills: ['Paxos ledger logic', 'Multi-leader clustering', 'Heartbeat coordinate logic'], momentum: 1, emerging: false, dominant: true },
          'Low-Level Systems Design': { strength: recruiterProfile?.differentiationScore || 0.91, skills: ['Rust compiler tooling', 'WASM orchestration', 'Native memory audits'], momentum: 0, emerging: false, dominant: false },
        },
        adjacent_roles: [
          { role: 'GPU Infrastructure Specialist', readiness: 0.91, gap_skills: ['CUDA optimization tuning'] },
          { role: 'Consensus Core Architect', readiness: 0.88, gap_skills: ['Raft/Paxos consensus design'] },
        ],
        competitiveness_score: metrics.matchScore / 100,
        drift_detected: false,
        drift_details: null,
        confidence: metrics.recruiterConfidence / 100,
      }
    : apiData;

  if (!data || !data.dominant_path) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Career Trajectory" subtitle="AI-powered career direction intelligence" />
        <Panel variant="inset" className="text-center py-12 border-white/[0.04] bg-white/[0.015]">
          <p className="text-white/30 text-xs">No active career trajectory records detected. Hydrate the operating system to map direction topologies.</p>
        </Panel>
      </div>
    );
  }

  const sortedReadiness = Object.entries(data.readiness_scores)
    .sort(([, a], [, b]) => b.score - a.score);

  const activeSpecs = Object.entries(data.specializations)
    .filter(([, s]) => s.strength > 0)
    .sort(([, a], [, b]) => b.strength - a.strength);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Career Trajectory"
        subtitle={simulationActive ? "Deterministic career direction topologies (Simulation Sandbox)" : "Deterministic career direction topologies"}
      />

      {/* Drift Alert */}
      {data.drift_detected && data.drift_details && (
        <Panel className="border-warning/50 bg-warning/5">
          <p className="text-sm text-warning">⚠ {data.drift_details}</p>
        </Panel>
      )}

      {/* Dominant Path + Competitiveness */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Dominant Career Vector</p>
          <p className="text-sm font-semibold text-white/80 leading-relaxed">{data.dominant_path}</p>
          {data.secondary_paths.length > 0 && (
            <p className="text-[10px] text-white/20 mt-2 font-mono uppercase">Alternate vectors: {data.secondary_paths.join(' • ')}</p>
          )}
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">Platform Competitiveness</p>
          <p className="text-2xl font-bold text-accent font-mono transition-all duration-700">{Math.round(data.competitiveness_score * 100)}%</p>
        </Panel>
        <Panel className="border-white/[0.04] bg-white/[0.015] hover:border-white/[0.08] transition-all">
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mb-2">System Confidence</p>
          <p className="text-2xl font-bold text-white font-mono transition-all duration-700">{Math.round(data.confidence * 100)}%</p>
        </Panel>
      </div>

      {/* Role Readiness */}
      <Panel className="border-white/[0.04] bg-white/[0.015]">
        <SectionHeader title="Role Readiness Profiles" />
        <div className="mt-4 space-y-4">
          {sortedReadiness.map(([role, scores]) => (
            <div key={role} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-48 text-xs text-white/60 font-semibold truncate">{role}</div>
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-1000"
                  style={{ width: `${Math.round(scores.score * 100)}%` }}
                />
              </div>
              <span className="text-xs text-white/35 font-mono w-10 text-right">{Math.round(scores.score * 100)}%</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Specializations */}
      {activeSpecs.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Validated Specialization Sub-systems" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeSpecs.map(([domain, spec]) => (
              <div key={domain} className="rounded-lg border border-white/[0.04] bg-white/[0.005] p-3.5 hover:border-white/[0.08] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/70 capitalize">{domain}</span>
                  <div className="flex gap-1">
                    {spec.dominant && <StatusBadge status="success">DOMINANT</StatusBadge>}
                    {spec.emerging && <StatusBadge status="warning">EMERGING</StatusBadge>}
                    {spec.momentum > 0 && <StatusBadge status="info">ACTIVE</StatusBadge>}
                  </div>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.04] mb-2.5">
                  <div className="h-full bg-success rounded-full transition-all duration-1000" style={{ width: `${Math.round(spec.strength * 100)}%` }} />
                </div>
                <p className="text-[10px] text-white/30 leading-relaxed font-mono">{spec.skills.join(' • ')}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Adjacent Roles */}
      {data.adjacent_roles.length > 0 && (
        <Panel className="border-white/[0.04] bg-white/[0.015]">
          <SectionHeader title="Adjacent Career Vectors" />
          <div className="mt-3 space-y-2">
            {data.adjacent_roles.map((adj) => (
              <div key={adj.role} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.005] px-1.5 rounded transition-colors">
                <div>
                  <span className="text-xs text-white/70 font-semibold">{adj.role}</span>
                  <p className="text-[10px] text-white/30 mt-0.5 leading-relaxed font-mono">Competency gap: {adj.gap_skills.join(' • ')}</p>
                </div>
                <span className="text-xs text-accent font-semibold font-mono">{Math.round(adj.readiness * 100)}% matched</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
