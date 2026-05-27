'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface RuntimePriority {
  action: string;
  impact: string;
  confidence: number;
  bottleneck: string;
}

interface RuntimePriorityContextType {
  priority: RuntimePriority | null;
  setPriority: (priority: RuntimePriority | null) => void;
}

const RuntimePriorityContext = createContext<RuntimePriorityContextType | undefined>(undefined);

export function RuntimePriorityProvider({ children }: { children: ReactNode }) {
  const [priority, setPriority] = useState<RuntimePriority | null>(null);

  return (
    <RuntimePriorityContext.Provider value={{ priority, setPriority }}>
      {children}
    </RuntimePriorityContext.Provider>
  );
}

export function useRuntimePriority() {
  const ctx = useContext(RuntimePriorityContext);
  if (!ctx) throw new Error('useRuntimePriority must be used within RuntimePriorityProvider');
  return ctx;
}
