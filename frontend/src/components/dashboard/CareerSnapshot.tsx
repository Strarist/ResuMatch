import React from 'react';
import { MetricCard } from '@/components/workspace';
import { Target, Award, Compass, FileText } from 'lucide-react';

interface CareerSnapshotProps {
  matchScore: number;
  profileStrength: number;
  careerGoal: string;
  resumeStatus: string;
}

export function CareerSnapshot({ matchScore, profileStrength, careerGoal, resumeStatus }: CareerSnapshotProps) {
  return (
    <section className="grid md:grid-cols-4 gap-4">
      <MetricCard label="Match Score" value={`${matchScore}%`} icon={Target} />
      <MetricCard label="Profile Strength" value={`${profileStrength}%`} icon={Award} />
      <MetricCard label="Career Goal" value={careerGoal} icon={Compass} />
      <MetricCard label="Resume Status" value={resumeStatus} icon={FileText} />
    </section>
  );
}
