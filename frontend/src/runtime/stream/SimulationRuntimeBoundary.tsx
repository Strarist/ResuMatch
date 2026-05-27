'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface SimulationBoundaryContextType {
  isSimulationActive: boolean;
  setIsSimulationActive: (active: boolean) => void;
}

const SimulationBoundaryContext = createContext<SimulationBoundaryContextType | undefined>(undefined);

export function SimulationRuntimeBoundaryProvider({ children }: { children: ReactNode }) {
  const [isSimulationActive, setIsSimulationActive] = useState(false);

  const value = useMemo(() => ({
    isSimulationActive,
    setIsSimulationActive
  }), [isSimulationActive]);

  return (
    <SimulationBoundaryContext.Provider value={value}>
      {children}
    </SimulationBoundaryContext.Provider>
  );
}

export function useSimulationBoundary() {
  const context = useContext(SimulationBoundaryContext);
  if (!context) {
    // Return a default fallback if used outside the provider (e.g. testing or initialization)
    return {
      isSimulationActive: false,
      setIsSimulationActive: () => {}
    };
  }
  return context;
}
