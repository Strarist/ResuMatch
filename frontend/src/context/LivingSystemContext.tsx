'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo, useReducer } from 'react';
import { toast } from 'sonner';
import { baselinePersonas, PersonaProfile } from '../data/baseline-profiles';
import { LifecycleStage } from '../state/user-lifecycle';
import { propagateIntelligence } from '../utils/intelligence-propagation';
import { fetchLifecycleBackendState, getLifecyclePollIntervalMs } from '@/lib/lifecycle-sync';
import { intelligence } from '@/lib/intelligence-client';

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
  dependencies?: string[];
  completionConfidence?: number;
  projectedImpact?: string;
  strategicRationale?: string;
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
  compensation?: string;
  recruiterPressure?: 'high' | 'medium' | 'low';
  hiringWindow?: string;
  stackCompatibility?: string;
  alignmentReasoning?: string;
  location?: string;
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
  revertRoadmapNode: (skill: string) => void;
  triggerSystemScan: () => Promise<void>;
  addCustomFeedItem: (source: string, message: string, urgency?: 'low' | 'medium' | 'high') => void;

  // Phase 11.1 additions
  activePersona: PersonaProfile;
  lifecycleStage: LifecycleStage;
  hasStrategicProfile: boolean;
  resumeParseStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  setLifecycleStage: (stage: LifecycleStage) => void;
  setActivePersonaId: (id: string) => void;
  resetLifecycle: () => void;
  syncLifecycleFromBackend: () => Promise<void>;
}

const LivingSystemContext = createContext<LivingSystemContextType | undefined>(undefined);

type State = {
  simulationActive: boolean;
  systemStatus: 'standby' | 'syncing' | 'active';
  lastUpdated: Date;
  feed: FeedItem[];
  activePersonaId: string;
  lifecycleStage: LifecycleStage;
  hasStrategicProfile: boolean;
  resumeParseStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed';
  completedSkills: string[];
  deferredSkills: string[];
};

type Action =
  | { type: 'SET_SIMULATION_ACTIVE'; payload: boolean }
  | { type: 'SET_SYSTEM_STATUS'; payload: 'standby' | 'syncing' | 'active' }
  | { type: 'ADD_FEED_ITEM'; payload: FeedItem }
  | { type: 'COMPLETE_NODE'; payload: string }
  | { type: 'DEFER_NODE'; payload: string }
  | { type: 'UNDO_NODE'; payload: string }
  | { type: 'SYSTEM_SCAN_START' }
  | { type: 'SYSTEM_SCAN_COMPLETE' }
  | { type: 'SET_LIFECYCLE_STAGE'; payload: LifecycleStage }
  | { type: 'SET_ACTIVE_PERSONA'; payload: string }
  | { type: 'RESET_LIFECYCLE' }
  | { type: 'LOAD_PERSISTED_STATE'; payload: Partial<State> }
  | { type: 'SYNC_LIFECYCLE_FROM_BACKEND'; payload: { lifecycleStage: LifecycleStage; hasStrategicProfile: boolean; resumeParseStatus: State['resumeParseStatus'] } };

const initialFeedItems: FeedItem[] = [
  { id: 'f-1', source: 'Orchestrator', eventType: 'system_boot', message: 'Career Operating System active. Synthesizing vectors.', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'f-2', source: 'Recruiter Engine', eventType: 'crawler_match', message: 'Recruiter crawler matched profile for selected trajectory.', createdAt: new Date(Date.now() - 2400000).toISOString() },
  { id: 'f-3', source: 'Market Intelligence', eventType: 'demand_shift', message: 'Market intelligence detected demand changes in key specializations.', createdAt: new Date(Date.now() - 1200000).toISOString() },
  { id: 'f-4', source: 'Execution Engine', eventType: 'vector_calculate', message: 'Competency alignment vectors recalculated successfully.', createdAt: new Date(Date.now() - 300000).toISOString() },
];

const initialState: State = {
  simulationActive: false, // Default to false to enable real database pipelines by default
  systemStatus: 'active',
  lastUpdated: new Date(),
  feed: initialFeedItems,
  activePersonaId: 'full-stack', // Default to Full Stack Engineer
  lifecycleStage: 1, // Start at Stage 1: Onboarding
  hasStrategicProfile: false,
  resumeParseStatus: 'none',
  completedSkills: [],
  deferredSkills: [],
};


function reducer(state: State, action: Action): State {
  let nextState = state;

  switch (action.type) {
    case 'SET_SIMULATION_ACTIVE':
      nextState = {
        ...state,
        simulationActive: action.payload,
        systemStatus: action.payload ? 'active' : 'standby',
      };
      break;
    case 'SET_SYSTEM_STATUS':
      nextState = { ...state, systemStatus: action.payload };
      break;
    case 'ADD_FEED_ITEM':
      nextState = {
        ...state,
        feed: [action.payload, ...state.feed.slice(0, 19)],
        lastUpdated: new Date(),
      };
      break;
    case 'COMPLETE_NODE': {
      const skillName = action.payload;
      if (state.completedSkills.includes(skillName)) break;

      const newCompleted = [...state.completedSkills, skillName];
      const newDeferred = state.deferredSkills.filter((s) => s !== skillName);

      // Auto advance to Stage 4 if they complete a high impact skill
      const nextStage = state.lifecycleStage === 3 ? 4 : state.lifecycleStage;

      nextState = {
        ...state,
        completedSkills: newCompleted,
        deferredSkills: newDeferred,
        lifecycleStage: nextStage,
        lastUpdated: new Date(),
      };
      break;
    }
    case 'DEFER_NODE': {
      const skillName = action.payload;
      if (state.deferredSkills.includes(skillName)) break;

      const newDeferred = [...state.deferredSkills, skillName];
      const newCompleted = state.completedSkills.filter((s) => s !== skillName);

      nextState = {
        ...state,
        deferredSkills: newDeferred,
        completedSkills: newCompleted,
        lastUpdated: new Date(),
      };
      break;
    }
    case 'UNDO_NODE': {
      const skillName = action.payload;
      const newCompleted = state.completedSkills.filter((s) => s !== skillName);
      const newDeferred = state.deferredSkills.filter((s) => s !== skillName);

      nextState = {
        ...state,
        completedSkills: newCompleted,
        deferredSkills: newDeferred,
        lastUpdated: new Date(),
      };
      break;
    }
    case 'SYSTEM_SCAN_START':
      nextState = {
        ...state,
        systemStatus: 'syncing',
      };
      break;
    case 'SYSTEM_SCAN_COMPLETE':
      nextState = {
        ...state,
        systemStatus: 'active',
        lastUpdated: new Date(),
      };
      break;
    case 'SYNC_LIFECYCLE_FROM_BACKEND':
      nextState = {
        ...state,
        lifecycleStage: action.payload.lifecycleStage,
        hasStrategicProfile: action.payload.hasStrategicProfile,
        resumeParseStatus: action.payload.resumeParseStatus,
        systemStatus: action.payload.resumeParseStatus === 'processing' ? 'syncing' : 'active',
        lastUpdated: new Date(),
      };
      break;
    case 'SET_LIFECYCLE_STAGE':
      nextState = {
        ...state,
        lifecycleStage: action.payload,
        lastUpdated: new Date(),
      };
      break;
    case 'SET_ACTIVE_PERSONA':
      nextState = {
        ...state,
        activePersonaId: action.payload,
        completedSkills: [], // Reset custom progress on persona switch to avoid leakage
        deferredSkills: [],
        lastUpdated: new Date(),
      };
      break;
    case 'RESET_LIFECYCLE':
      nextState = {
        ...state,
        lifecycleStage: 1,
        hasStrategicProfile: false,
        resumeParseStatus: 'none',
        completedSkills: [],
        deferredSkills: [],
        lastUpdated: new Date(),
      };
      break;
    case 'LOAD_PERSISTED_STATE':
      nextState = {
        ...state,
        ...action.payload,
      };
      break;
    default:
      break;
  }

  // Persist state in localStorage to survive router reloads
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('skillyn_strategic_state', JSON.stringify({
        activePersonaId: nextState.activePersonaId,
        lifecycleStage: nextState.lifecycleStage,
        completedSkills: nextState.completedSkills,
        deferredSkills: nextState.deferredSkills,
        simulationActive: nextState.simulationActive,
      }));
    } catch (e) {
      console.error('Failed to persist strategic state:', e);
    }
  }

  return nextState;
}

export function LivingSystemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('skillyn_strategic_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'LOAD_PERSISTED_STATE', payload: parsed });
        }
      } catch (e) {
        console.error('Failed to load strategic state:', e);
      }
    }
  }, []);

  const addCustomFeedItem = useCallback((source: string, message: string, urgency: 'low' | 'medium' | 'high' = 'low') => {
    dispatch({
      type: 'ADD_FEED_ITEM',
      payload: {
        id: `f-${Math.random().toString(36).substring(2, 11)}`,
        source,
        eventType: 'runtime_log',
        message,
        createdAt: new Date().toISOString(),
        urgency,
      }
    });
  }, []);

  // Compute derived state based on active persona and lifecycle stage
  const activePersona = useMemo(() => {
    const base = baselinePersonas.find((p) => p.id === state.activePersonaId) || baselinePersonas[0]!;
    return propagateIntelligence(
      base,
      state.lifecycleStage,
      state.completedSkills,
      state.deferredSkills
    );
  }, [state.activePersonaId, state.lifecycleStage, state.completedSkills, state.deferredSkills]);

  const syncLifecycleFromBackend = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    const backend = await fetchLifecycleBackendState();
    dispatch({
      type: 'SYNC_LIFECYCLE_FROM_BACKEND',
      payload: {
        lifecycleStage: state.lifecycleStage >= 4 && backend.hasStrategicProfile
          ? 4
          : backend.lifecycleStage,
        hasStrategicProfile: backend.hasStrategicProfile,
        resumeParseStatus: backend.resumeParseStatus,
      },
    });
  }, [state.lifecycleStage]);

  // Sync lifecycle from backend when not in simulation mode
  useEffect(() => {
    if (state.simulationActive) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = (backend: Awaited<ReturnType<typeof fetchLifecycleBackendState>>) => {
      if (cancelled) return;
      const intervalMs = getLifecyclePollIntervalMs(backend);
      if (intervalMs === null) return;
      timeoutId = setTimeout(() => void tick(), intervalMs);
    };

    const tick = async () => {
      if (cancelled) return;
      const backend = await fetchLifecycleBackendState();
      if (cancelled) return;
      dispatch({
        type: 'SYNC_LIFECYCLE_FROM_BACKEND',
        payload: {
          lifecycleStage: state.lifecycleStage >= 4 && backend.hasStrategicProfile
            ? 4
            : backend.lifecycleStage,
          hasStrategicProfile: backend.hasStrategicProfile,
          resumeParseStatus: backend.resumeParseStatus,
        },
      });
      scheduleNext(backend);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state.simulationActive, state.lifecycleStage]);

  const triggerSystemScan = useCallback(async () => {
    dispatch({ type: 'SYSTEM_SCAN_START' });
    addCustomFeedItem('Orchestrator', 'Syncing career profile with backend...', 'medium');

    try {
      await intelligence.recompute();
      await syncLifecycleFromBackend();
      dispatch({ type: 'SYSTEM_SCAN_COMPLETE' });
      addCustomFeedItem('Orchestrator', 'Profile synced with backend intelligence layer.', 'high');
      toast.success('Career profile synced');
    } catch (err) {
      console.error('[LivingSystem] triggerSystemScan failed:', err);
      dispatch({ type: 'SYSTEM_SCAN_COMPLETE' });
      toast.error('Profile sync failed — retry from dashboard');
    }
  }, [addCustomFeedItem, syncLifecycleFromBackend]);

  const completeRoadmapNode = useCallback((skillName: string) => {
    dispatch({ type: 'COMPLETE_NODE', payload: skillName });
    addCustomFeedItem(
      'Execution Engine',
      `Marked "${skillName}" as complete. Recruiter signals and match matrices adjusted upward.`,
      'high'
    );
    toast.success(`Completed milestone: ${skillName}`);
  }, [addCustomFeedItem]);

  const deferRoadmapNode = useCallback((skillName: string) => {
    dispatch({ type: 'DEFER_NODE', payload: skillName });
    addCustomFeedItem(
      'Execution Engine',
      `Deferred "${skillName}". Trajectory calibration updated.`,
      'medium'
    );
    toast(`Deferred milestone: ${skillName}`);
  }, [addCustomFeedItem]);

  const revertRoadmapNode = useCallback((skillName: string) => {
    dispatch({ type: 'UNDO_NODE', payload: skillName });
    addCustomFeedItem(
      'Execution Engine',
      `Reverted "${skillName}" status. Profile alignment updated.`,
      'medium'
    );
    toast(`Reverted milestone: ${skillName}`);
  }, [addCustomFeedItem]);

  const setSimulationActive = useCallback((active: boolean) => {
    dispatch({ type: 'SET_SIMULATION_ACTIVE', payload: active });
  }, []);

  const setLifecycleStage = useCallback((stage: LifecycleStage) => {
    dispatch({ type: 'SET_LIFECYCLE_STAGE', payload: stage });
    addCustomFeedItem('System', `Lifecycle transition: Advanced to Stage ${stage}`, 'medium');
  }, [addCustomFeedItem]);

  const setActivePersonaId = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_PERSONA', payload: id });
    const targetPersona = baselinePersonas.find((p) => p.id === id);
    if (targetPersona) {
      addCustomFeedItem('Orchestrator', `Swapped baseline persona template to ${targetPersona.name}`, 'high');
    }
  }, [addCustomFeedItem]);

  const resetLifecycle = useCallback(() => {
    dispatch({ type: 'RESET_LIFECYCLE' });
    addCustomFeedItem('System', 'Reset lifecycle state to onboarding baseline.', 'medium');
    toast('Profile states reset');
  }, [addCustomFeedItem]);

  const value = useMemo(
    () => ({
      simulationActive: state.simulationActive,
      setSimulationActive,
      systemStatus: state.systemStatus,
      metrics: activePersona.metrics,
      metricsHistory: activePersona.metricsHistory,
      feed: state.feed,
      roadmap: activePersona.roadmap,
      opportunities: activePersona.opportunities,
      recruiterProfile: activePersona.recruiterProfile,
      lastUpdated: state.lastUpdated,
      completeRoadmapNode,
      deferRoadmapNode,
      revertRoadmapNode,
      triggerSystemScan,
      addCustomFeedItem,

      activePersona,
      lifecycleStage: state.lifecycleStage,
      hasStrategicProfile: state.hasStrategicProfile,
      resumeParseStatus: state.resumeParseStatus,
      setLifecycleStage,
      setActivePersonaId,
      resetLifecycle,
      syncLifecycleFromBackend,
    }),
    [
      state.simulationActive,
      setSimulationActive,
      state.systemStatus,
      state.feed,
      state.lastUpdated,
      activePersona,
      state.lifecycleStage,
      state.hasStrategicProfile,
      state.resumeParseStatus,
      completeRoadmapNode,
      deferRoadmapNode,
      revertRoadmapNode,
      triggerSystemScan,
      addCustomFeedItem,
      setLifecycleStage,
      setActivePersonaId,
      resetLifecycle,
      syncLifecycleFromBackend,
    ]
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
