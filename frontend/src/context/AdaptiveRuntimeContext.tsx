'use client';

import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIntelligenceMetrics } from './IntelligenceMetricsContext';
import { useMutationFeed } from './MutationFeedContext';
import { useCausalGraph } from './CausalGraphContext';
import { usePropagation } from './PropagationContext';
import { useRuntimePriority } from './RuntimePriorityContext';
import { useAgentTelemetry } from './AgentTelemetryContext';
import { useStrategicDirective } from './StrategicDirectiveContext';
import { RuntimeStateReconciler } from '../utils/RuntimeStateReconciler';
import { RuntimeStreamManager } from '@/runtime/stream/RuntimeStreamManager';
import { StreamEvent, TransportState } from '@/runtime/stream/StreamLifecycle';
import { useSimulationBoundary } from '@/runtime/stream/SimulationRuntimeBoundary';
import { useAuth } from '@/auth/AuthContext';

interface AdaptiveRuntimeContextType {
  status: TransportState;
}

const AdaptiveRuntimeContext = createContext<AdaptiveRuntimeContextType | undefined>(undefined);

export function AdaptiveRuntimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<TransportState>('OFFLINE');
  const { metrics, setMetrics } = useIntelligenceMetrics();
  const { addLog } = useMutationFeed();
  const { nodes, edges, setGraph } = useCausalGraph();
  const { propagationFeed, setPropagationFeed } = usePropagation();
  const { priority, setPriority } = useRuntimePriority();
  const { agents, setAgents } = useAgentTelemetry();
  const { directive, setDirective } = useStrategicDirective();

  const { isSimulationActive } = useSimulationBoundary();
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const streamRoutes = ['/dashboard', '/workspace', '/opportunities', '/market-intelligence', '/roadmap-v2'];
  const shouldConnectStream =
    isAuthenticated &&
    !isSimulationActive &&
    streamRoutes.some((route) => pathname?.startsWith(route));
  const isSimulationActiveRef = useRef(isSimulationActive);
  useEffect(() => { isSimulationActiveRef.current = isSimulationActive; }, [isSimulationActive]);

  // Refs to prevent stale closures in EventSource listeners
  const metricsRef = useRef(metrics);
  const graphRef = useRef({ nodes, edges });
  const propagationFeedRef = useRef(propagationFeed);
  const priorityRef = useRef(priority);
  const agentsRef = useRef(agents);
  const directiveRef = useRef(directive);

  // Refs for setters to make handlePayload completely stable
  const setMetricsRef = useRef(setMetrics);
  const addLogRef = useRef(addLog);
  const setGraphRef = useRef(setGraph);
  const setPropagationFeedRef = useRef(setPropagationFeed);
  const setPriorityRef = useRef(setPriority);
  const setAgentsRef = useRef(setAgents);
  const setDirectiveRef = useRef(setDirective);

  useEffect(() => { metricsRef.current = metrics; }, [metrics]);
  useEffect(() => { graphRef.current = { nodes, edges }; }, [nodes, edges]);
  useEffect(() => { propagationFeedRef.current = propagationFeed; }, [propagationFeed]);
  useEffect(() => { priorityRef.current = priority; }, [priority]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);
  useEffect(() => { directiveRef.current = directive; }, [directive]);

  useEffect(() => { setMetricsRef.current = setMetrics; }, [setMetrics]);
  useEffect(() => { addLogRef.current = addLog; }, [addLog]);
  useEffect(() => { setGraphRef.current = setGraph; }, [setGraph]);
  useEffect(() => { setPropagationFeedRef.current = setPropagationFeed; }, [setPropagationFeed]);
  useEffect(() => { setPriorityRef.current = setPriority; }, [setPriority]);
  useEffect(() => { setAgentsRef.current = setAgents; }, [setAgents]);
  useEffect(() => { setDirectiveRef.current = setDirective; }, [setDirective]);

  const handlePayload = useCallback((payload: unknown, isUpdate = false) => {
    if (isSimulationActiveRef.current) return;
    if (!payload || typeof payload !== 'object') return;
    const p = payload as Record<string, unknown>;

    // Apply stable merges
    if (!isUpdate || p.type === 'metrics') {
      if (p.data) {
        setMetricsRef.current(RuntimeStateReconciler.deepMergeStable(metricsRef.current, p.data));
      }
    }

    if (isUpdate && p.type === 'mutation') {
      if (p.metrics) {
        setMetricsRef.current(RuntimeStateReconciler.deepMergeStable(metricsRef.current, p.metrics));
      }
      const mut = p.mutation as Record<string, unknown> | null;
      if (mut && typeof mut === 'object' && mut.signal) {
        addLogRef.current({
          signal: String(mut.signal),
          delta: String(mut.delta ?? ""),
          reason: String(mut.reason ?? ""),
          confidence: String(mut.confidence ?? "System"),
          time: 'Just now'
        });
      }
    }

    if (p.graph) {
      const mergedGraph = RuntimeStateReconciler.deepMergeStable(
        graphRef.current,
        p.graph as unknown as Partial<typeof graphRef.current>
      );
      setGraphRef.current(mergedGraph);
    }
    if (p.propagation) {
      const mergedPropagation = RuntimeStateReconciler.deepMergeStable(
        propagationFeedRef.current,
        p.propagation as unknown as Partial<typeof propagationFeedRef.current>
      );
      setPropagationFeedRef.current(mergedPropagation);
    }
    if (p.leverage) {
      const mergedPriority = RuntimeStateReconciler.deepMergeStable(
        priorityRef.current,
        p.leverage as unknown as Partial<typeof priorityRef.current>
      );
      setPriorityRef.current(mergedPriority);
    }
    if (p.orchestration && typeof p.orchestration === 'object') {
      const orch = p.orchestration as Record<string, unknown>;
      if (orch.agent_activity) {
        const mergedAgents = RuntimeStateReconciler.deepMergeStable(
          agentsRef.current,
          orch.agent_activity as unknown as Partial<typeof agentsRef.current>
        );
        setAgentsRef.current(mergedAgents);
      }
      if (orch.directive) {
        const mergedDirective = RuntimeStateReconciler.deepMergeStable(
          directiveRef.current,
          orch.directive as unknown as Partial<typeof directiveRef.current>
        );
        setDirectiveRef.current(mergedDirective);
      }
    }
  }, []);

  useEffect(() => {
    const manager = RuntimeStreamManager.getInstance();

    if (!shouldConnectStream) {
      manager.safeDestroy();
      setStatus('OFFLINE');
      return;
    }

    const handleStreamEvent = (event: StreamEvent) => {
      if (event.event === 'transport_state') {
        const stateData = event.data as { state: TransportState };
        setStatus(stateData.state);
        return;
      }
      if (event.event === 'init') {
        handlePayload(event.data, false);
      } else if (event.event === 'update') {
        handlePayload(event.data, true);
      }
    };

    manager.registerListener(handleStreamEvent);
    manager.connect();

    return () => {
      manager.unregisterListener(handleStreamEvent);
    };
  }, [shouldConnectStream, handlePayload]);

  const value = React.useMemo(() => ({ status }), [status]);

  return (
    <AdaptiveRuntimeContext.Provider value={value}>
      {children}
    </AdaptiveRuntimeContext.Provider>
  );
}

export function useAdaptiveRuntime() {
  const ctx = useContext(AdaptiveRuntimeContext);
  if (!ctx) throw new Error('useAdaptiveRuntime must be used within AdaptiveRuntimeProvider');
  return ctx;
}
