'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PropagationEvent {
  source: string;
  target: string;
  impact: string;
}

interface PropagationContextType {
  propagationFeed: PropagationEvent[];
  setPropagationFeed: (feed: PropagationEvent[]) => void;
}

const PropagationContext = createContext<PropagationContextType | undefined>(undefined);

export function PropagationProvider({ children }: { children: ReactNode }) {
  const [propagationFeed, setPropagationFeed] = useState<PropagationEvent[]>([]);

  return (
    <PropagationContext.Provider value={{ propagationFeed, setPropagationFeed }}>
      {children}
    </PropagationContext.Provider>
  );
}

export function usePropagation() {
  const ctx = useContext(PropagationContext);
  if (!ctx) throw new Error('usePropagation must be used within PropagationProvider');
  return ctx;
}
