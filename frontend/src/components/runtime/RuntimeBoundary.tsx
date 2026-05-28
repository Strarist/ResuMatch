'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RuntimeBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in RuntimeBoundary:', error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-[#0c1220]/50 border border-red-500/20 rounded-xl min-h-[200px]">
          <AlertTriangle size={24} className="text-red-400 mb-3" />
          <h3 className="text-[13px] font-extrabold tracking-widest uppercase text-slate-200 mb-2">
            {this.props.fallbackTitle || 'Workspace Component Error'}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono text-center max-w-sm mb-4">
            {this.props.fallbackDescription ||
             'This zone of the career strategy workspace encountered a runtime error and has been isolated.'}
          </p>
          <button
            onClick={this.handleRecover}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCcw size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Attempt Recovery</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
