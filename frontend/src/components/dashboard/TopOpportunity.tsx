import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Opportunity } from '@/types/dashboard';

interface TopOpportunityProps {
  opportunity?: Opportunity;
  onViewOpportunities: () => void;
}

export function TopOpportunity({ opportunity, onViewOpportunities }: TopOpportunityProps) {
  if (!opportunity) return null;

  const reasons = opportunity.reasons?.length
    ? opportunity.reasons
    : opportunity.alignmentScore
      ? [`Strong ${Math.round(opportunity.alignmentScore * 100)}% alignment with your verified skills`]
      : ['Matches your current career trajectory'];

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-surface-raised via-surface-raised to-sky-500/5 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="text-[11px] font-bold uppercase tracking-widest text-sky-400/80 mb-3">Top Opportunity</p>
      <h3 className="text-base font-semibold text-text">{opportunity.title}</h3>
      <p className="text-sm text-text-secondary mt-1">{opportunity.company}</p>
      <p className="text-sm font-medium text-emerald-400 mt-2">
        Match: {Math.round((opportunity.alignmentScore || 0) * 100)}%
      </p>
      <p className="text-xs text-text-tertiary mt-3 mb-1">Why recommended</p>
      <ul className="space-y-1 text-xs text-text-secondary">
        {reasons.slice(0, 3).map((r, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-emerald-400">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <Button onClick={onViewOpportunities} variant="outline" className="mt-4 border-sky-500/30 hover:bg-sky-500/10">
        View Opportunities <ChevronRight size={14} className="ml-1" />
      </Button>
    </div>
  );
}
