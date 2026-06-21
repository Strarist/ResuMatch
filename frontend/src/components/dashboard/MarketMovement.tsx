import React from 'react';
import { SectionLabel, Panel, Button } from '@/components/workspace';
import { ChevronRight } from 'lucide-react';


interface MarketMovementProps {
  trendingSkills: string[];
  demandDirection: string;
  onViewMarket: () => void;
}

export function MarketMovement({ trendingSkills, demandDirection, onViewMarket }: MarketMovementProps) {
  return (
    <Panel className="p-6">
      <SectionLabel>Market Movement</SectionLabel>
      <p className="text-xs mt-2 font-medium">Trending Skills</p>
      <ul className="list-disc list-inside text-xs text-slate-400 mt-1">
        {trendingSkills.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p className="text-xs mt-2 font-medium">Demand Direction</p>
      <p className="text-xs text-slate-400">{demandDirection}</p>
      <Button onClick={onViewMarket} variant="outline" className="mt-3">
        View Market Intelligence <ChevronRight size={14} className="ml-1" />
      </Button>
    </Panel>
  );
}
