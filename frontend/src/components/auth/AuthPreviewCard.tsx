import { Panel, MetricCard } from '@/components/workspace';
import { Target, Award, Compass, FileText } from 'lucide-react';

export function AuthPreviewCard() {
  return (
    <Panel className="p-6 space-y-4">
      <MetricCard label="Match Score" value="85%" icon={Target} />
      <MetricCard label="Roadmap Progress" value="45%" icon={Award} />
      <MetricCard label="Top Opportunity" value="Data Engineer" icon={Compass} />
      <MetricCard label="Market Insight" value="Talent demand ↑" icon={FileText} />
    </Panel>
  );
}
