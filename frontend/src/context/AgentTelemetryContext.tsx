'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AgentActivity {
  agent_id: string;
  decision_type: string;
  confidence: number;
  payload: {
    signal: string;
    details: string;
  };
}

interface AgentTelemetryContextType {
  agents: AgentActivity[];
  setAgents: (agents: AgentActivity[]) => void;
}

const AgentTelemetryContext = createContext<AgentTelemetryContextType | undefined>(undefined);

export function AgentTelemetryProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<AgentActivity[]>([]);

  return (
    <AgentTelemetryContext.Provider value={{ agents, setAgents }}>
      {children}
    </AgentTelemetryContext.Provider>
  );
}

export function useAgentTelemetry() {
  const ctx = useContext(AgentTelemetryContext);
  if (!ctx) throw new Error('useAgentTelemetry must be used within AgentTelemetryProvider');
  return ctx;
}
