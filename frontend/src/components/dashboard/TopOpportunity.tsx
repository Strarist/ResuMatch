import React from 'react';
import { SectionLabel, Panel, Button } from '@/components/workspace';
import { ChevronRight } from 'lucide-react';
import type { Opportunity } from '@/types/dashboard';

interface TopOpportunityProps {
  opportunity?: Opportunity;
  onViewOpportunities: () => void;
}

export function TopOpportunity({ opportunity, onViewOpportunities }: TopOpportunityProps) {
  if (!opportunity) return null;
  return (
    <Panel className="p-6">
      <SectionLabel>Top Opportunity</SectionLabel>
      <h3 className="text-sm font-semibold mt-2">{opportunity.title}</h3>
      <p className="text-xs text-slate-400">{opportunity.company}</p>
      <p className="text-xs font-medium mt-1">Match: {Math.round(opportunity.alignmentScore * 100)}%</p>
      <p className="text-xs mt-2">Why Recommended:</p>
      <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
        {opportunity.reasons?.slice(0, 3).map((r, i) => (
          <li key={i}>✓ {r}</li>
        ))}
      </ul>
      <Button onClick={onViewOpportunities} variant="outline" className="mt-3">
        View Opportunities <ChevronRight size={14} className="ml-1" />
      </Button>
    </Panel>
  );
}
