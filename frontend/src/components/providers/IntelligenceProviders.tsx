'use client';

import { ReactNode } from 'react';
import { IntelligenceMetricsProvider } from '@/context/IntelligenceMetricsContext';
import { MutationFeedProvider } from '@/context/MutationFeedContext';
import { AdaptiveRuntimeProvider } from '@/context/AdaptiveRuntimeContext';
import { StrategicMemoryProvider } from '@/context/StrategicMemoryContext';
import { CausalGraphProvider } from '@/context/CausalGraphContext';
import { PropagationProvider } from '@/context/PropagationContext';
import { RuntimePriorityProvider } from '@/context/RuntimePriorityContext';
import { AgentTelemetryProvider } from '@/context/AgentTelemetryContext';
import { StrategicDirectiveProvider } from '@/context/StrategicDirectiveContext';
import { SimulationRuntimeBoundaryProvider } from '@/runtime/stream/SimulationRuntimeBoundary';

export function IntelligenceProviders({ children }: { children: ReactNode }) {
  return (
    <SimulationRuntimeBoundaryProvider>
      <StrategicMemoryProvider>
        <CausalGraphProvider>
          <PropagationProvider>
            <RuntimePriorityProvider>
              <AgentTelemetryProvider>
                <StrategicDirectiveProvider>
                  <IntelligenceMetricsProvider>
                    <MutationFeedProvider>
                      <AdaptiveRuntimeProvider>
                        {children}
                      </AdaptiveRuntimeProvider>
                    </MutationFeedProvider>
                  </IntelligenceMetricsProvider>
                </StrategicDirectiveProvider>
              </AgentTelemetryProvider>
            </RuntimePriorityProvider>
          </PropagationProvider>
        </CausalGraphProvider>
      </StrategicMemoryProvider>
    </SimulationRuntimeBoundaryProvider>
  );
}
