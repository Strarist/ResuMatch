import React from 'react';
import { Panel, SectionLabel, Button } from '@/components/workspace';
import { ChevronRight } from 'lucide-react';

type AIInsightProps = {
  insight?: string;
  onAskAI: () => void;
};

export function AIInsight({ insight, onAskAI }: AIInsightProps) {
  if (!insight) return null;
  return (
    <Panel className="p-6">
      <SectionLabel>AI Insight</SectionLabel>
      <p className="text-sm mt-2">{insight}</p>
      <Button onClick={onAskAI} variant="outline" className="mt-3">
        Ask AI Coach <ChevronRight size={14} className="ml-1" />
      </Button>
    </Panel>
  );
}
