import React from 'react';
import { Target, Award, Compass, FileText } from 'lucide-react';

interface CareerSnapshotProps {
  matchScore: number;
  profileStrength: number;
  careerGoal: string;
  resumeStatus: string;
}

const cards = [
  { key: 'match', label: 'Match Score', icon: Target, accent: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
  { key: 'strength', label: 'Profile Strength', icon: Award, accent: 'from-sky-500/20 to-sky-500/5', border: 'border-sky-500/20', iconColor: 'text-sky-400' },
  { key: 'goal', label: 'Career Goal', icon: Compass, accent: 'from-violet-500/20 to-violet-500/5', border: 'border-violet-500/20', iconColor: 'text-violet-400' },
  { key: 'resume', label: 'Resume Status', icon: FileText, accent: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20', iconColor: 'text-amber-400' },
] as const;

export function CareerSnapshot({ matchScore, profileStrength, careerGoal, resumeStatus }: CareerSnapshotProps) {
  const values: Record<string, string> = {
    match: `${Math.round(matchScore)}%`,
    strength: `${Math.round(profileStrength)}%`,
    goal: careerGoal,
    resume: resumeStatus,
  };

  return (
    <section className="grid md:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, accent, border, iconColor }) => (
        <div
          key={key}
          className={`rounded-xl border ${border} bg-gradient-to-br ${accent} p-4 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
            <Icon size={14} className={iconColor} />
          </div>
          <p className={`font-semibold text-text ${key === 'goal' || key === 'resume' ? 'text-sm leading-snug' : 'text-2xl'}`}>
            {values[key]}
          </p>
        </div>
      ))}
    </section>
  );
}
