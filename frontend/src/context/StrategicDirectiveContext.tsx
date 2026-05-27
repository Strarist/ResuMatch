'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StrategicDirective {
  directive_type: string;
  description: string;
  rationale: string;
  priority_level: string;
}

interface StrategicDirectiveContextType {
  directive: StrategicDirective | null;
  setDirective: (directive: StrategicDirective | null) => void;
}

const StrategicDirectiveContext = createContext<StrategicDirectiveContextType | undefined>(undefined);

export function StrategicDirectiveProvider({ children }: { children: ReactNode }) {
  const [directive, setDirective] = useState<StrategicDirective | null>(null);

  return (
    <StrategicDirectiveContext.Provider value={{ directive, setDirective }}>
      {children}
    </StrategicDirectiveContext.Provider>
  );
}

export function useStrategicDirective() {
  const ctx = useContext(StrategicDirectiveContext);
  if (!ctx) throw new Error('useStrategicDirective must be used within StrategicDirectiveProvider');
  return ctx;
}
