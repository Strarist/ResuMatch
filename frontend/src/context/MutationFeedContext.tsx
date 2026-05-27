'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ExplainabilityLog {
  signal: string;
  delta: string;
  reason: string;
  confidence: string;
  time: string;
}

interface MutationFeedContextType {
  feed: ExplainabilityLog[];
  addLog: (log: ExplainabilityLog) => void;
}

const defaultFeed: ExplainabilityLog[] = [
  {
    signal: 'Target Role Alignment',
    delta: '+4%',
    reason: 'Added Distributed Systems keywords to profile',
    confidence: 'High (0.89)',
    time: '2m ago'
  },
  {
    signal: 'Recruiter Confidence',
    delta: '+0.2',
    reason: 'Market demand shifted towards your stack',
    confidence: 'Verified Source',
    time: '12m ago'
  }
];

const MutationFeedContext = createContext<MutationFeedContextType | undefined>(undefined);

export function MutationFeedProvider({ children }: { children: ReactNode }) {
  const [feed, setFeed] = useState<ExplainabilityLog[]>(defaultFeed);

  const addLog = (log: ExplainabilityLog) => {
    setFeed(prev => [log, ...prev].slice(0, 10)); // Keep last 10
  };

  return (
    <MutationFeedContext.Provider value={{ feed, addLog }}>
      {children}
    </MutationFeedContext.Provider>
  );
}

export function useMutationFeed() {
  const ctx = useContext(MutationFeedContext);
  if (!ctx) throw new Error('useMutationFeed must be used within MutationFeedProvider');
  return ctx;
}
