'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { EmptyState } from '@/components/workspace';
import { env } from '@/lib/env';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Map, Zap } from 'lucide-react';


interface RoadmapNode {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  effort_weeks: number;
  impact_estimate: number;
  reason: string;
}

interface RoadmapStateData {
  target_role: string;
  version: number;
  milestones: RoadmapNode[];
}

export default function AdaptiveRoadmapPage() {
  const [apiState, setApiState] = useState<RoadmapStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    simulationActive,
    roadmap: simRoadmap,
    completeRoadmapNode,
    deferRoadmapNode,
    triggerSystemScan,
    systemStatus,
    feed
  } = useLivingSystem();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/state`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.state) {
          setApiState({
            target_role: d.state.target_role,
            version: d.state.version,
            milestones: d.state.snapshot?.milestones?.map((m: { skill: string; priority?: 'high' | 'medium' | 'low'; effort_weeks?: number; impact_estimate?: number; reason?: string }) => ({
              skill: m.skill,
              priority: m.priority || 'medium',
              effort_weeks: m.effort_weeks || 4,
              impact_estimate: m.impact_estimate || 80,
              reason: m.reason || '',
            })) || [],
          });
        }
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

  const markComplete = async (skill: string) => {
    if (simulationActive) {
      completeRoadmapNode(skill);
      return;
    }
    const token = localStorage.getItem('access_token');
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/node/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ skill }),
    });
    fetchData();
  };

  const markDeferred = async (skill: string) => {
    if (simulationActive) {
      deferRoadmapNode(skill);
      return;
    }
    const token = localStorage.getItem('access_token');
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/node/defer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ skill }),
    });
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" /></div>;

  // Resolve active states
  const activeRoleName = simulationActive ? 'Principal AI Platform Architect' : apiState?.target_role;
  const activeVersion = simulationActive ? 3 : apiState?.version || 1;

  // Adapt simulated nodes to same visual mapping format
  const activeMilestones = simulationActive
    ? simRoadmap.map(m => ({
        skill: m.skill,
        priority: m.priority,
        effort_weeks: m.effortWeeks,
        impact_estimate: m.impactEstimate,
        reason: m.reason,
        status: m.status, // Preserve completion status for filtering / styling
      }))
    : apiState?.milestones.map(m => ({
        ...m,
        status: 'active' as const,
      })) || [];

  if (activeMilestones.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Adaptive Roadmap" subtitle="Persistent career progression intelligence" />
        <EmptyState
          icon={Map}
          title="Roadmap Offline"
          description="Analyze a profile or activate simulated telemetry to compile dynamic milestones."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Adaptive Roadmap"
        subtitle={simulationActive ? `${activeRoleName} • v${activeVersion} (Simulation Sandbox)` : `${activeRoleName} • v${activeVersion}`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={triggerSystemScan}
              disabled={systemStatus === 'syncing'}
              className="rounded-lg px-3 py-1.5 text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap size={11} className={systemStatus === 'syncing' ? 'animate-spin' : ''} />
              {systemStatus === 'syncing' ? 'Mutating Graph...' : '↻ Reprioritize'}
            </button>
          </div>
        }
      />

      {/* Focus Area Labels */}
      {simulationActive && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-tertiary">Active Focus Vectors:</span>
          {['cuda-optimization', 'consensus-protocols', 'serving-layers'].map(f => (
            <span key={f} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent capitalize">{f.replace(/-/g, ' ')}</span>
          ))}
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-3">
        {activeMilestones.map((node) => {
          const isCompleted = node.status === 'completed';
          const isDeferred = node.status === 'deferred';
          return (
            <Panel key={node.skill} className={`transition-all duration-500 border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/[0.08] ${isCompleted ? 'opacity-50 border-emerald-500/10' : ''} ${isDeferred ? 'opacity-40 border-amber-500/10' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-success/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                      <span className="text-xs text-success font-bold">✓</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markComplete(node.skill)}
                      disabled={isDeferred}
                      className="h-6 w-6 rounded-full border border-white/20 hover:border-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all bg-black/40 hover:bg-blue-500/10 disabled:opacity-50"
                    />
                  )}
                  <div>
                    <span className={`text-body font-medium text-white/85 ${isCompleted ? 'line-through text-white/40' : ''}`}>{node.skill}</span>
                    <p className="text-xs text-white/35 mt-1 leading-relaxed">{node.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                  <StatusBadge status={node.priority === 'high' ? 'error' : node.priority === 'medium' ? 'warning' : 'info'}>
                    {node.priority}
                  </StatusBadge>
                  <span className="text-xs text-white/35 font-mono">{node.effort_weeks} weeks</span>

                  {!isCompleted && !isDeferred && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => markComplete(node.skill)}
                        className="rounded px-2.5 py-1 text-xs border border-success/20 text-success hover:bg-success/15 bg-success/[0.04] transition-all font-medium"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => markDeferred(node.skill)}
                        className="rounded px-2 py-1 text-xs border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-all"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Evolution Timeline logs */}
      <Panel className="border-white/[0.04] bg-white/[0.015]">
        <SectionHeader title="Operating System Evolution logs" />
        <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {simulationActive ? (
            feed.slice(0, 6).map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs py-1 hover:bg-white/[0.01] px-1.5 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-white/60">{e.message}</span>
                </div>
                <span className="text-[10px] text-white/20 font-mono">{new Date(e.createdAt).toLocaleTimeString()}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/25">Connect database state or toggle simulation parameters to display timeline evolution telemetry.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
