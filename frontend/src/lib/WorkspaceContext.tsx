'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { AnalysisResult } from '@/lib/useStreamingAnalysis';
import type { RoadmapStructure } from '@/lib/useStreamingRoadmap';

/**
 * Workspace context persists state across feature navigation.
 * When a user runs an analysis, the result stays available when they
 * switch to the roadmap or cover letter view — no re-fetching needed.
 */

interface WorkspaceState {
  // Active selections
  activeResumeId: string | null;
  activeJobDescription: string | null;
  activeJobTitle: string | null;

  // Cached results (persist across navigation)
  lastAnalysis: AnalysisResult | null;
  lastRoadmap: RoadmapStructure | null;
  lastCoverLetter: string | null;

  // UI state
  drawerOpen: boolean;
  drawerContent: 'analysis' | 'roadmap' | 'cover-letter' | null;
}

interface WorkspaceActions {
  setActiveResume: (id: string) => void;
  setJobContext: (description: string, title?: string) => void;
  cacheAnalysis: (result: AnalysisResult) => void;
  cacheRoadmap: (structure: RoadmapStructure) => void;
  cacheCoverLetter: (content: string) => void;
  openDrawer: (content: WorkspaceState['drawerContent']) => void;
  closeDrawer: () => void;
  reset: () => void;
}

type WorkspaceContextType = WorkspaceState & WorkspaceActions;

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const INITIAL_STATE: WorkspaceState = {
  activeResumeId: null,
  activeJobDescription: null,
  activeJobTitle: null,
  lastAnalysis: null,
  lastRoadmap: null,
  lastCoverLetter: null,
  drawerOpen: false,
  drawerContent: null,
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(INITIAL_STATE);

  const setActiveResume = useCallback((id: string) => {
    setState((s) => ({ ...s, activeResumeId: id }));
  }, []);

  const setJobContext = useCallback((description: string, title?: string) => {
    setState((s) => ({ ...s, activeJobDescription: description, activeJobTitle: title ?? s.activeJobTitle }));
  }, []);

  const cacheAnalysis = useCallback((result: AnalysisResult) => {
    setState((s) => ({ ...s, lastAnalysis: result }));
  }, []);

  const cacheRoadmap = useCallback((structure: RoadmapStructure) => {
    setState((s) => ({ ...s, lastRoadmap: structure }));
  }, []);

  const cacheCoverLetter = useCallback((content: string) => {
    setState((s) => ({ ...s, lastCoverLetter: content }));
  }, []);

  const openDrawer = useCallback((content: WorkspaceState['drawerContent']) => {
    setState((s) => ({ ...s, drawerOpen: true, drawerContent: content }));
  }, []);

  const closeDrawer = useCallback(() => {
    setState((s) => ({ ...s, drawerOpen: false }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return (
    <WorkspaceContext.Provider value={{
      ...state, setActiveResume, setJobContext, cacheAnalysis,
      cacheRoadmap, cacheCoverLetter, openDrawer, closeDrawer, reset,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextType {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
