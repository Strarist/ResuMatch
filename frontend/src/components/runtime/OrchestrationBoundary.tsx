'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Activity } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class OrchestrationBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Orchestration Boundary Caught Error in [${this.props.fallback}]:`, error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 border border-slate-800 rounded-xl min-h-[150px] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <span className="text-[9px] font-bold tracking-widest uppercase text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              DEGRADED
            </span>
          </div>

          <Activity size={16} className="text-slate-600 mb-2" />
          <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-1">
            {this.props.fallback}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono text-center max-w-[80%] mb-3">
            Module telemetry interrupted. Attempting to restore orchestration continuity...
          </p>
          <button
            onClick={this.handleRecover}
            className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80 hover:text-blue-300 transition-colors"
          >
            Force Re-Sync
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
