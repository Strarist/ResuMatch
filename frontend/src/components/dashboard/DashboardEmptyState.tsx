import { Panel } from '@/components/workspace';


export interface DashboardEmptyStateProps {
  missingResume: boolean;
  missingRoadmap: boolean;
  missingOpportunities: boolean;
}

export function DashboardEmptyState({
  missingResume,
  missingRoadmap,
  missingOpportunities,
}: DashboardEmptyStateProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-10">
      {missingResume && (
        <Panel className="p-6 bg-blue-500/5 border border-blue-500/20">
          <h3 className="text-lg font-bold">Upload a resume to generate:</h3>
          <ul className="list-disc list-inside mt-2 text-sm">
            <li>Career Profile</li>
            <li>Roadmap</li>
            <li>Opportunities</li>
          </ul>
        </Panel>
      )}
      {missingRoadmap && (
        <Panel className="p-6 bg-yellow-500/5 border border-yellow-500/20">
          <h3 className="text-lg font-bold">
            Generate your roadmap to receive personalized guidance.
          </h3>
        </Panel>
      )}
      {missingOpportunities && (
        <Panel className="p-6 bg-purple-500/5 border border-purple-500/20">
          <h3 className="text-lg font-bold">
            Complete your profile to unlock personalized opportunities.
          </h3>
        </Panel>
      )}
    </div>
  );
}
