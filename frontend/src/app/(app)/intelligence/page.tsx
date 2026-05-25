'use client';

import { useEffect, useState } from 'react';
import { Panel, SectionHeader, StatusBadge } from '@/components/ds';
import { env } from '@/lib/env';

interface SkillEntry {
  skill: string;
  confidence: number;
  proficiency: number;
  occurrences: number;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

interface CareerProfile {
  inferred_seniority: string;
  preferred_domains: string[];
  strongest_skill_clusters: Array<{ domain: string; skills: string[]; count: number }>;
  growth_velocity: number;
  confidence_snapshot: { avg_confidence: number; total_skills: number; high_confidence_count: number };
}

export default function IntelligencePage() {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/profile`, { headers }).then((r) => r.json()),
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/skills`, { headers }).then((r) => r.json()),
      fetch(`${env.NEXT_PUBLIC_API_URL}/v1/intelligence/timeline`, { headers }).then((r) => r.json()),
    ]).then(([p, s, t]) => {
      setProfile(p);
      setSkills(s.skills || []);
      setTimeline(t.events || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader title="Intelligence" subtitle="Persistent AI career memory" />

      {/* Career Profile */}
      {profile && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Panel className="text-center">
            <span className="text-xs text-text-tertiary">Seniority</span>
            <p className="text-h2 font-semibold text-text capitalize">{profile.inferred_seniority}</p>
          </Panel>
          <Panel className="text-center">
            <span className="text-xs text-text-tertiary">Growth Velocity</span>
            <p className="text-h2 font-semibold text-accent">{(profile.growth_velocity * 100).toFixed(0)}%</p>
          </Panel>
          <Panel className="text-center">
            <span className="text-xs text-text-tertiary">Tracked Skills</span>
            <p className="text-h2 font-semibold text-text">{profile.confidence_snapshot?.total_skills ?? 0}</p>
          </Panel>
        </div>
      )}

      {/* Skill Clusters */}
      {profile?.strongest_skill_clusters && profile.strongest_skill_clusters.length > 0 && (
        <Panel>
          <SectionHeader title="Skill Clusters" subtitle="Detected specializations" />
          <div className="mt-3 space-y-3">
            {profile.strongest_skill_clusters.map((c) => (
              <div key={c.domain} className="flex items-center gap-3">
                <span className="w-24 text-small font-medium text-text capitalize">{c.domain}</span>
                <div className="flex flex-wrap gap-1">
                  {c.skills.map((s) => (
                    <span key={s} className="rounded-md bg-accent-subtle px-2 py-0.5 text-xs text-accent">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Panel>
          <SectionHeader title="Tracked Skills" subtitle={`${skills.length} skills detected`} />
          <div className="mt-3 space-y-1.5">
            {skills.slice(0, 15).map((s) => (
              <div key={s.skill} className="flex items-center gap-3">
                <span className="w-32 truncate text-small text-text">{s.skill}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${s.confidence * 100}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-mono text-text-tertiary">{(s.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <Panel>
          <SectionHeader title="Memory Timeline" subtitle="Intelligence events" />
          <div className="mt-3 space-y-2">
            {timeline.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg bg-surface-inset px-3 py-2">
                <StatusBadge status={e.event_type.includes('added') ? 'success' : e.event_type.includes('strengthened') ? 'info' : 'neutral'}>
                  {e.event_type.replace(/_/g, ' ')}
                </StatusBadge>
                <span className="text-xs text-text-secondary">
                  {JSON.stringify(e.payload).slice(0, 60)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
