'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StrategicMemoryTimelineEvent {
  title: string;
  description: string;
  confidence: number;
  time: string;
  type: 'momentum' | 'decay' | 'specialization';
}

interface StrategicMemoryContextType {
  timeline: StrategicMemoryTimelineEvent[];
  setTimeline: (events: StrategicMemoryTimelineEvent[]) => void;
}

const defaultTimeline: StrategicMemoryTimelineEvent[] = [
  { title: "Consistent Portfolio Proofs", description: "Sustained high-execution phase detected over 3 weeks.", confidence: 0.94, time: "Active", type: "momentum" },
  { title: "Specialization Drift", description: "Trajectory shifting heavily towards low-latency infrastructure.", confidence: 0.88, time: "2d ago", type: "specialization" }
];

const StrategicMemoryContext = createContext<StrategicMemoryContextType | undefined>(undefined);

export function StrategicMemoryProvider({ children }: { children: ReactNode }) {
  const [timeline, setTimeline] = useState<StrategicMemoryTimelineEvent[]>(defaultTimeline);

  return (
    <StrategicMemoryContext.Provider value={{ timeline, setTimeline }}>
      {children}
    </StrategicMemoryContext.Provider>
  );
}

export function useStrategicMemory() {
  const ctx = useContext(StrategicMemoryContext);
  if (!ctx) throw new Error('useStrategicMemory must be used within StrategicMemoryProvider');
  return ctx;
}
