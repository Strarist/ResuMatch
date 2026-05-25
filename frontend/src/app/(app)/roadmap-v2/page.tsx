'use client';

import { useCallback, useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';

interface RoadmapNode {
  skill: string;
  priority: string;
  effort_weeks: number;
  impact_estimate: number;
  reason: string;
  prerequisites?: string[];
}

interface RoadmapStateData {
  id: string;
  target_role: string;
  version: number;
  snapshot: { milestones: RoadmapNode[] };
  completed_nodes: string[];
  deferred_nodes: string[];
  active_focus_areas: string[];
  learning_velocity: number;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export default function AdaptiveRoadmapPage() {
  const [state, setState] = useState<RoadmapStateData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const [s, t] = await Promise.all([
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/state`, { headers }).then(r => r.json()),
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/timeline`, { headers }).then(r => r.json()),
    ]);
    setState(s.state);
    setTimeline(t.events || []);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markComplete = async (skill: string) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/node/complete`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ skill }),
    });
    fetchData();
  };

  const markDeferred = async (skill: string) => {
    const token = localStorage.getItem('access_token');
    await fetch(`${env.NEXT_PUBLIC_API_URL}/v1/roadmap-intel/node/defer`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ skill }),
    });
    fetchData();
  };

  if (!state) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Adaptive Roadmap" subtitle="Persistent career progression intelligence" />
        <Panel variant="inset" className="text-center py-12">
          <p className="text-text-secondary">No active roadmap. Run an analysis to generate one.</p>
        </Panel>
      </div>
    );
  }

  const completedSet = new Set(state.completed_nodes || []);
  const deferredSet = new Set(state.deferred_nodes || []);
  const milestones = state.snapshot?.milestones || [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Adaptive Roadmap" subtitle={`${state.target_role} • v${state.version}`} />

      {/* Focus Areas */}
      {state.active_focus_areas?.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Focus:</span>
          {state.active_focus_areas.map(f => (
            <span key={f} className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent capitalize">{f}</span>
          ))}
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-2">
        {milestones.map((node) => {
          const isCompleted = completedSet.has(node.skill);
          const isDeferred = deferredSet.has(node.skill);
          return (
            <Panel key={node.skill} className={`${isCompleted ? 'opacity-50' : ''} ${isDeferred ? 'opacity-40' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                      <span className="text-xs text-success">✓</span>
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-border" />
                  )}
                  <div>
                    <span className="text-body font-medium text-text">{node.skill}</span>
                    <p className="text-xs text-text-tertiary">{node.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={node.priority === 'high' ? 'error' : node.priority === 'medium' ? 'warning' : 'info'}>
                    {node.priority}
                  </StatusBadge>
                  <span className="text-xs text-text-tertiary">{node.effort_weeks}w</span>
                  {!isCompleted && !isDeferred && (
                    <div className="flex gap-1">
                      <button onClick={() => markComplete(node.skill)} className="rounded px-1.5 py-0.5 text-xs text-success hover:bg-success/10">✓</button>
                      <button onClick={() => markDeferred(node.skill)} className="rounded px-1.5 py-0.5 text-xs text-text-tertiary hover:bg-surface-overlay">skip</button>
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Panel>
          <SectionHeader title="Evolution Timeline" />
          <div className="mt-3 space-y-2">
            {timeline.slice(0, 8).map(e => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <StatusBadge status={e.event_type.includes('completed') ? 'success' : 'neutral'}>
                  {e.event_type.replace(/_/g, ' ')}
                </StatusBadge>
                <span className="text-text-tertiary">{new Date(e.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
