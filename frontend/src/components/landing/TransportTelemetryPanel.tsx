'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Shield, RefreshCw, Radio, HardDrive, AlertTriangle } from 'lucide-react';
import { RuntimeStreamManager } from '@/runtime/stream/RuntimeStreamManager';
import { TransportMetrics } from '@/runtime/stream/StreamLifecycle';

export function TransportTelemetryPanel() {
  const [metrics, setMetrics] = useState<TransportMetrics | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(RuntimeStreamManager.getInstance().getMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    const manager = RuntimeStreamManager.getInstance();
    const listener = () => updateMetrics();
    manager.registerListener(listener);

    return () => {
      clearInterval(interval);
      manager.unregisterListener(listener);
    };
  }, []);

  if (!metrics) return null;

  const stateColors: Record<string, string> = {
    CONNECTING: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    LIVE: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    DEGRADED: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    RECONNECTING: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
    COOLDOWN: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    OFFLINE: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
    DESTROYED: 'text-slate-500 border-slate-500/20 bg-slate-500/5',
  };

  const badgeColor = stateColors[metrics.state] || 'text-slate-400';

  return (
    <div className="mt-8 p-4 rounded-xl border border-slate-800 bg-slate-950/80 backdrop-blur font-mono">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
        <Radio size={12} className="text-blue-400" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
          Orchestration Transport Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px]">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Transport State</span>
          <span className={`px-2 py-0.5 border rounded w-fit font-bold uppercase text-[9px] ${badgeColor}`}>
            {metrics.state}
          </span>
        </div>

        {/* Latency */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Heartbeat Latency</span>
          <span className="text-slate-200 font-bold flex items-center gap-1">
            <Activity size={10} className="text-slate-400" />
            {metrics.heartbeatLatency}ms
          </span>
        </div>

        {/* Active Listeners */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Active Listeners</span>
          <span className="text-slate-200 font-bold flex items-center gap-1">
            <HardDrive size={10} className="text-slate-400" />
            {metrics.activeListeners} slots
          </span>
        </div>

        {/* Reconnect Count */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Reconnect Retries</span>
          <span className="text-slate-200 font-bold flex items-center gap-1">
            <RefreshCw size={10} className="text-slate-400" />
            {metrics.reconnectCount} times
          </span>
        </div>

        {/* Degraded Cycles */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Degraded Cycles</span>
          <span className="text-slate-200 font-bold flex items-center gap-1">
            <AlertTriangle size={10} className="text-slate-400" />
            {metrics.degradedCycles} ticks
          </span>
        </div>

        {/* Cooldown */}
        <div className="flex flex-col gap-1">
          <span className="text-slate-500 uppercase text-[9px] font-bold">Cooldown State</span>
          <span className="text-slate-200 font-bold flex items-center gap-1">
            <Shield size={10} className="text-slate-400" />
            {metrics.cooldownState ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      </div>
    </div>
  );
}
