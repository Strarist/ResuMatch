'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

export interface FeedItem {
  id: string;
  source: string;
  eventType: string;
  message: string;
  createdAt: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface RoadmapNode {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  effortWeeks: number;
  impactEstimate: number;
  reason: string;
  status: 'active' | 'completed' | 'deferred';
}

export interface OpportunityMatch {
  title: string;
  company: string;
  alignmentScore: number;
  confidence: number;
  urgency: 'high' | 'medium' | 'low';
  type: string;
  missingRequirements: string[];
  proofGaps: string[];
}

export interface RecruiterSignalProfile {
  hiringConfidence: number;
  productionReadiness: number;
  technicalDepth: number;
  specializationStrength: number;
  differentiationScore: number;
  portfolioMaturity: string;
  strongestSignals: string[];
  hiringRisks: string[];
  roleFit: { role: string; skillReadiness: number; proofAdjusted: number; missing: string[] }[];
}

interface LivingSystemContextType {
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;
  systemStatus: 'standby' | 'syncing' | 'active';
  metrics: {
    matchScore: number;
    careerVelocity: number;
    marketFit: number;
    recruiterConfidence: number;
  };
  metricsHistory: {
    matchScore: number[];
    careerVelocity: number[];
    marketFit: number[];
    recruiterConfidence: number[];
  };
  feed: FeedItem[];
  roadmap: RoadmapNode[];
  opportunities: OpportunityMatch[];
  recruiterProfile: RecruiterSignalProfile | null;
  lastUpdated: Date;
  completeRoadmapNode: (skill: string) => void;
  deferRoadmapNode: (skill: string) => void;
  triggerSystemScan: () => Promise<void>;
  addCustomFeedItem: (source: string, message: string, urgency?: 'low' | 'medium' | 'high') => void;
}

const LivingSystemContext = createContext<LivingSystemContextType | undefined>(undefined);

// Simulated data for Principal AI Systems Architect
const initialSimulatedRoadmap: RoadmapNode[] = [
  {
    skill: 'CUDA Kernel Optimization',
    priority: 'high',
    effortWeeks: 6,
    impactEstimate: 95,
    reason: 'Critical gap for GPU-accelerated infrastructure roles at top labs.',
    status: 'active',
  },
  {
    skill: 'Distributed Transactions (Raft/Paxos)',
    priority: 'high',
    effortWeeks: 8,
    impactEstimate: 92,
    reason: 'Necessary for building resilient high-throughput coordinate engines.',
    status: 'active',
  },
  {
    skill: 'LLM Serving Layer (vLLM/TensorRT)',
    priority: 'medium',
    effortWeeks: 4,
    impactEstimate: 85,
    reason: 'Enables high-performance low-latency orchestration of model execution.',
    status: 'active',
  },
  {
    skill: 'Rust Core Systems Design',
    priority: 'low',
    effortWeeks: 3,
    impactEstimate: 78,
    reason: 'Strengthens production compiler diagnostics and memory safety proof.',
    status: 'active',
  },
];

const initialSimulatedOpportunities: OpportunityMatch[] = [
  {
    title: 'Principal AI Platform Architect',
    company: 'Vercel',
    alignmentScore: 0.95,
    confidence: 0.92,
    urgency: 'high',
    type: 'Full-time / Remote',
    missingRequirements: ['CUDA Kernel Optimization'],
    proofGaps: ['Demonstrated vLLM custom routing at scale'],
  },
  {
    title: 'Distributed Infrastructure Lead',
    company: 'Stripe',
    alignmentScore: 0.91,
    confidence: 0.89,
    urgency: 'medium',
    type: 'Hybrid / SF',
    missingRequirements: ['Raft/Paxos consensus experience'],
    proofGaps: ['Multi-region database ledger write-path audit'],
  },
  {
    title: 'Staff Systems Engineer',
    company: 'Linear',
    alignmentScore: 0.88,
    confidence: 0.85,
    urgency: 'low',
    type: 'Remote',
    missingRequirements: ['Rust Systems Core'],
    proofGaps: ['WASM engine integration benchmark logs'],
  },
];

const initialSimulatedRecruiterProfile: RecruiterSignalProfile = {
  hiringConfidence: 0.88,
  productionReadiness: 0.92,
  technicalDepth: 0.94,
  specializationStrength: 0.89,
  differentiationScore: 0.91,
  portfolioMaturity: 'production_mature',
  strongestSignals: [
    'Validated distributed caching implementation proof',
    'Demonstrated competency in latency-bound network topology',
    'Robust open-source contributions in compiler frameworks',
  ],
  hiringRisks: [
    'Low front-end density (minimal visual system proof)',
    'Missing formal cloud security certification (SOC 2 validation proof)',
  ],
  roleFit: [
    { role: 'AI Platform Architect', skillReadiness: 0.92, proofAdjusted: 0.89, missing: ['CUDA Kernel Optimization'] },
    { role: 'Staff Systems Engineer', skillReadiness: 0.88, proofAdjusted: 0.84, missing: ['Raft/Paxos'] },
    { role: 'Senior Core Backend', skillReadiness: 0.96, proofAdjusted: 0.94, missing: [] },
  ],
};

const initialFeedItems: FeedItem[] = [
  { id: 'f-1', source: 'Orchestrator', eventType: 'system_boot', message: 'Career Operating System active. Synthesizing vectors.', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'f-2', source: 'Recruiter Engine', eventType: 'crawler_match', message: 'Recruiter crawler matched profile for Principal AI at Vercel.', createdAt: new Date(Date.now() - 2400000).toISOString() },
  { id: 'f-3', source: 'Market Intelligence', eventType: 'demand_shift', message: 'Market intelligence detected 14% growth in high-performance computing demand.', createdAt: new Date(Date.now() - 1200000).toISOString() },
  { id: 'f-4', source: 'Execution Engine', eventType: 'vector_calculate', message: 'Competency alignment vectors recalculated successfully.', createdAt: new Date(Date.now() - 300000).toISOString() },
];

type State = {
  simulationActive: boolean;
  systemStatus: 'standby' | 'syncing' | 'active';
  lastUpdated: Date;
  feed: FeedItem[];
  roadmap: RoadmapNode[];
  opportunities: OpportunityMatch[];
  recruiterProfile: RecruiterSignalProfile | null;
  metrics: {
    matchScore: number;
    careerVelocity: number;
    marketFit: number;
    recruiterConfidence: number;
  };
  metricsHistory: {
    matchScore: number[];
    careerVelocity: number[];
    marketFit: number[];
    recruiterConfidence: number[];
  };
};

type Action =
  | { type: 'SET_SIMULATION_ACTIVE'; payload: boolean }
  | { type: 'SET_SYSTEM_STATUS'; payload: 'standby' | 'syncing' | 'active' }
  | { type: 'TICK' }
  | { type: 'ADD_FEED_ITEM'; payload: FeedItem }
  | { type: 'COMPLETE_NODE'; payload: string }
  | { type: 'DEFER_NODE'; payload: string }
  | { type: 'SYSTEM_SCAN_START' }
  | { type: 'SYSTEM_SCAN_COMPLETE' };

const getInitialMetrics = () => ({
  matchScore: 0,
  careerVelocity: 0,
  marketFit: 0,
  recruiterConfidence: 0,
});

const getInitialMetricsHistory = () => ({
  matchScore: [0,0,0,0,0,0,0,0,0,0],
  careerVelocity: [0,0,0,0,0,0,0,0,0,0],
  marketFit: [0,0,0,0,0,0,0,0,0,0],
  recruiterConfidence: [0,0,0,0,0,0,0,0,0,0],
});

const activeMetrics = {
  matchScore: 94.0,
  careerVelocity: 78.0,
  marketFit: 91.0,
  recruiterConfidence: 87.0,
};

const activeMetricsHistory = {
  matchScore: [91.2, 91.8, 92.5, 92.9, 93.1, 93.4, 93.7, 93.9, 94.0, 94.0],
  careerVelocity: [65.0, 68.0, 70.2, 71.5, 73.0, 74.2, 75.8, 76.5, 77.2, 78.0],
  marketFit: [88.0, 88.5, 89.0, 89.2, 89.7, 90.1, 90.4, 90.8, 90.9, 91.0],
  recruiterConfidence: [81.0, 82.2, 83.5, 84.0, 84.8, 85.3, 86.0, 86.4, 86.8, 87.0],
};

const initialState: State = {
  simulationActive: false,
  systemStatus: 'standby',
  lastUpdated: new Date(),
  feed: initialFeedItems,
  roadmap: initialSimulatedRoadmap,
  opportunities: initialSimulatedOpportunities,
  recruiterProfile: null,
  metrics: getInitialMetrics(),
  metricsHistory: getInitialMetricsHistory(),
};

function reducer(state: State, action: Action): State {
  const appendH = (arr: number[], val: number) => {
    const nextArr = [...arr, val];
    if (nextArr.length > 10) nextArr.shift();
    return nextArr;
  };

  switch (action.type) {
    case 'SET_SIMULATION_ACTIVE':
      if (action.payload) {
        return {
          ...state,
          simulationActive: true,
          systemStatus: 'active',
          metrics: activeMetrics,
          metricsHistory: activeMetricsHistory,
          roadmap: initialSimulatedRoadmap,
          opportunities: initialSimulatedOpportunities,
          recruiterProfile: initialSimulatedRecruiterProfile,
          lastUpdated: new Date()
        };
      } else {
        return {
          ...state,
          simulationActive: false,
          systemStatus: 'standby',
          metrics: getInitialMetrics(),
          metricsHistory: getInitialMetricsHistory(),
          recruiterProfile: null,
          lastUpdated: new Date()
        };
      }
    case 'SET_SYSTEM_STATUS':
      return { ...state, systemStatus: action.payload };
    case 'ADD_FEED_ITEM':
      return {
        ...state,
        feed: [action.payload, ...state.feed.slice(0, 19)],
        lastUpdated: new Date()
      };
    case 'TICK': {
      if (state.systemStatus !== 'active') return state;
      const driftScore = (Math.random() - 0.5) * 0.4;
      const driftFit = (Math.random() - 0.5) * 0.2;
      const driftVelocity = (Math.random() - 0.5) * 0.3;
      const driftRecruiter = (Math.random() - 0.5) * 0.4;

      const nextMatch = parseFloat(Math.min(99.9, Math.max(10.0, state.metrics.matchScore + driftScore)).toFixed(1));
      const nextFit = parseFloat(Math.min(99.9, Math.max(10.0, state.metrics.marketFit + driftFit)).toFixed(1));
      const nextVel = parseFloat(Math.min(99.9, Math.max(10.0, state.metrics.careerVelocity + driftVelocity)).toFixed(1));
      const nextRec = parseFloat(Math.min(99.9, Math.max(10.0, state.metrics.recruiterConfidence + driftRecruiter)).toFixed(1));

      return {
        ...state,
        metrics: {
          matchScore: nextMatch,
          marketFit: nextFit,
          careerVelocity: nextVel,
          recruiterConfidence: nextRec,
        },
        metricsHistory: {
          matchScore: appendH(state.metricsHistory.matchScore, nextMatch),
          marketFit: appendH(state.metricsHistory.marketFit, nextFit),
          careerVelocity: appendH(state.metricsHistory.careerVelocity, nextVel),
          recruiterConfidence: appendH(state.metricsHistory.recruiterConfidence, nextRec),
        },
        opportunities: state.opportunities.map((opp) => {
          const sDrift = (Math.random() - 0.5) * 0.02;
          const cDrift = (Math.random() - 0.5) * 0.015;
          return {
            ...opp,
            alignmentScore: parseFloat(Math.min(0.99, Math.max(0.6, opp.alignmentScore + sDrift)).toFixed(3)),
            confidence: parseFloat(Math.min(0.99, Math.max(0.6, opp.confidence + cDrift)).toFixed(3)),
          };
        }),
        recruiterProfile: state.recruiterProfile ? {
          ...state.recruiterProfile,
          hiringConfidence: parseFloat(Math.min(0.99, Math.max(0.6, state.recruiterProfile.hiringConfidence + (Math.random() - 0.5) * 0.015)).toFixed(3)),
          productionReadiness: parseFloat(Math.min(0.99, Math.max(0.6, state.recruiterProfile.productionReadiness + (Math.random() - 0.5) * 0.01)).toFixed(3)),
        } : null,
      };
    }
    case 'SYSTEM_SCAN_START':
      return {
        ...state,
        systemStatus: 'syncing',
      };
    case 'SYSTEM_SCAN_COMPLETE': {
      const nextMatch = Math.min(99.0, parseFloat((state.metrics.matchScore + 0.5).toFixed(1)));
      const nextVel = Math.min(99.0, parseFloat((state.metrics.careerVelocity + 1.2).toFixed(1)));
      const nextFit = Math.min(99.0, parseFloat((state.metrics.marketFit + 0.3).toFixed(1)));
      const nextRec = Math.min(99.0, parseFloat((state.metrics.recruiterConfidence + 0.8).toFixed(1)));

      return {
        ...state,
        systemStatus: 'active',
        metrics: {
          matchScore: nextMatch,
          careerVelocity: nextVel,
          marketFit: nextFit,
          recruiterConfidence: nextRec,
        },
        metricsHistory: {
          ...state.metricsHistory,
          matchScore: appendH(state.metricsHistory.matchScore, nextMatch),
          careerVelocity: appendH(state.metricsHistory.careerVelocity, nextVel),
          marketFit: appendH(state.metricsHistory.marketFit, nextFit),
          recruiterConfidence: appendH(state.metricsHistory.recruiterConfidence, nextRec),
        },
        lastUpdated: new Date()
      };
    }
    case 'COMPLETE_NODE': {
      const skillName = action.payload;
      const nextMatch = Math.min(99, state.metrics.matchScore + 2.1);
      const nextVel = Math.min(99, state.metrics.careerVelocity + 3.5);
      const nextRec = Math.min(99, state.metrics.recruiterConfidence + 4.0);

      return {
        ...state,
        roadmap: state.roadmap.map((node) => (node.skill === skillName ? { ...node, status: 'completed' } : node)),
        metrics: {
          ...state.metrics,
          matchScore: nextMatch,
          careerVelocity: nextVel,
          recruiterConfidence: nextRec,
        },
        metricsHistory: {
          ...state.metricsHistory,
          matchScore: appendH(state.metricsHistory.matchScore, nextMatch),
          careerVelocity: appendH(state.metricsHistory.careerVelocity, nextVel),
          recruiterConfidence: appendH(state.metricsHistory.recruiterConfidence, nextRec),
        },
        recruiterProfile: state.recruiterProfile ? {
          ...state.recruiterProfile,
          hiringConfidence: Math.min(0.99, state.recruiterProfile.hiringConfidence + 0.04),
          productionReadiness: Math.min(0.99, state.recruiterProfile.productionReadiness + 0.03),
          roleFit: state.recruiterProfile.roleFit.map((f) => {
            if (f.missing.includes(skillName)) {
              return {
                ...f,
                skillReadiness: Math.min(1.0, f.skillReadiness + 0.05),
                proofAdjusted: Math.min(1.0, f.proofAdjusted + 0.06),
                missing: f.missing.filter((s) => s !== skillName),
              };
            }
            return f;
          }),
        } : null,
        opportunities: state.opportunities.map((opp) => {
          if (opp.missingRequirements.includes(skillName)) {
            return {
              ...opp,
              alignmentScore: Math.min(0.99, opp.alignmentScore + 0.03),
              confidence: Math.min(0.99, opp.confidence + 0.02),
              missingRequirements: opp.missingRequirements.filter((r) => r !== skillName),
            };
          }
          return opp;
        })
      };
    }
    case 'DEFER_NODE': {
      const skillName = action.payload;
      const nextVel = Math.max(10, state.metrics.careerVelocity - 1.5);
      const nextRec = Math.max(10, state.metrics.recruiterConfidence - 2.0);

      return {
        ...state,
        roadmap: state.roadmap.map((node) => (node.skill === skillName ? { ...node, status: 'deferred' } : node)),
        metrics: {
          ...state.metrics,
          careerVelocity: nextVel,
          recruiterConfidence: nextRec,
        },
        metricsHistory: {
          ...state.metricsHistory,
          careerVelocity: appendH(state.metricsHistory.careerVelocity, nextVel),
          recruiterConfidence: appendH(state.metricsHistory.recruiterConfidence, nextRec),
        },
        recruiterProfile: state.recruiterProfile ? {
          ...state.recruiterProfile,
          hiringConfidence: Math.max(0.1, state.recruiterProfile.hiringConfidence - 0.02),
        } : null,
      };
    }
    default:
      return state;
  }
}

export function LivingSystemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addCustomFeedItem = useCallback((source: string, message: string, urgency: 'low' | 'medium' | 'high' = 'low') => {
    dispatch({
      type: 'ADD_FEED_ITEM',
      payload: {
        id: `f-${Math.random().toString(36).substr(2, 9)}`,
        source,
        eventType: 'runtime_log',
        message,
        createdAt: new Date().toISOString(),
        urgency,
      }
    });
  }, []);

  useEffect(() => {
    if (state.simulationActive) {
      addCustomFeedItem('Simulation Controller', 'Telemetry sandbox loaded. Running simulated workload.', 'high');
      toast.success('Simulation Telemetry Active');
    }
  }, [state.simulationActive, addCustomFeedItem]);

  useEffect(() => {
    if (state.systemStatus !== 'active') return;
    // TICK loop removed to prevent Provider Complexity Risk and cascading rerenders.
    // Intelligence metrics are now updated via SSE in AdaptiveRuntimeContext.
  }, [state.systemStatus, addCustomFeedItem]);

  const triggerSystemScan = useCallback(async () => {
    dispatch({ type: 'SYSTEM_SCAN_START' });
    addCustomFeedItem('Orchestrator', 'Initiating full-stack index re-calibration...', 'medium');

    await new Promise((resolve) => setTimeout(resolve, 1200));

    dispatch({ type: 'SYSTEM_SCAN_COMPLETE' });
    addCustomFeedItem('Orchestrator', 'Full-stack index re-calibration completed. All vectors synchronized.', 'high');
    toast.success('Career System Scan Completed');
  }, [addCustomFeedItem]);

  const completeRoadmapNode = useCallback((skillName: string) => {
    dispatch({ type: 'COMPLETE_NODE', payload: skillName });
    addCustomFeedItem(
      'Execution Engine',
      `Marked "${skillName}" as complete. Recruiter confidence adjusted upward (+4.0%).`,
      'high'
    );
    toast.success(`Completed ${skillName}`);
  }, [addCustomFeedItem]);

  const deferRoadmapNode = useCallback((skillName: string) => {
    dispatch({ type: 'DEFER_NODE', payload: skillName });
    addCustomFeedItem(
      'Execution Engine',
      `Deferred "${skillName}". Systems calibration: Velocity and recruiter readiness adjusted.`,
      'medium'
    );
    toast(`Deferred "${skillName}"`);
  }, [addCustomFeedItem]);

  const setSimulationActive = useCallback((active: boolean) => {
    dispatch({ type: 'SET_SIMULATION_ACTIVE', payload: active });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setSimulationActive,
      completeRoadmapNode,
      deferRoadmapNode,
      triggerSystemScan,
      addCustomFeedItem,
    }),
    [state, setSimulationActive, completeRoadmapNode, deferRoadmapNode, triggerSystemScan, addCustomFeedItem]
  );

  return (
    <LivingSystemContext.Provider value={value}>
      {children}
    </LivingSystemContext.Provider>
  );
}

export function useLivingSystem() {
  const context = useContext(LivingSystemContext);
  if (!context) {
    throw new Error('useLivingSystem must be used within a LivingSystemProvider');
  }
  return context;
}
