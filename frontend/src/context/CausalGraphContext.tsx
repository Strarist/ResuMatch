'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CausalNode {
  id: string;
  label: string;
  domain: string;
}

export interface CausalEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface CausalGraphContextType {
  nodes: CausalNode[];
  edges: CausalEdge[];
  setGraph: (graph: { nodes: CausalNode[]; edges: CausalEdge[] }) => void;
}

const CausalGraphContext = createContext<CausalGraphContextType | undefined>(undefined);

export function CausalGraphProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<CausalNode[]>([]);
  const [edges, setEdges] = useState<CausalEdge[]>([]);

  const setGraph = React.useCallback((graph: { nodes: CausalNode[]; edges: CausalEdge[] }) => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, []);

  const value = React.useMemo(() => ({ nodes, edges, setGraph }), [nodes, edges, setGraph]);

  return (
    <CausalGraphContext.Provider value={value}>
      {children}
    </CausalGraphContext.Provider>
  );
}

export function useCausalGraph() {
  const ctx = useContext(CausalGraphContext);
  if (!ctx) throw new Error('useCausalGraph must be used within CausalGraphProvider');
  return ctx;
}
