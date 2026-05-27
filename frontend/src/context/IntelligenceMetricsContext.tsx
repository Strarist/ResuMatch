'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Metrics {
  matchScore: number;
  careerVelocity: number;
  marketFit: number;
  recruiterConfidence: number;
}

interface IntelligenceMetricsContextType {
  metrics: Metrics;
  setMetrics: (metrics: Metrics) => void;
}

const defaultMetrics: Metrics = {
  matchScore: 94.0,
  careerVelocity: 78.0,
  marketFit: 91.0,
  recruiterConfidence: 87.0,
};

const IntelligenceMetricsContext = createContext<IntelligenceMetricsContextType | undefined>(undefined);

export function IntelligenceMetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);

  return (
    <IntelligenceMetricsContext.Provider value={{ metrics, setMetrics }}>
      {children}
    </IntelligenceMetricsContext.Provider>
  );
}

export function useIntelligenceMetrics() {
  const ctx = useContext(IntelligenceMetricsContext);
  if (!ctx) throw new Error('useIntelligenceMetrics must be used within IntelligenceMetricsProvider');
  return ctx;
}
