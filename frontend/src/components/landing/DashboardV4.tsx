'use client';

import React from 'react';
import { Activity, Zap, Radar, BarChart3, Clock, GitCommit, GitBranch, Target, Brain, Network, ArrowRight, ShieldAlert, CheckCircle2, Menu, X } from 'lucide-react';
import { useAdaptiveRuntime } from '@/context/AdaptiveRuntimeContext';
import { useMutationFeed } from '@/context/MutationFeedContext';
import { useStrategicMemory } from '@/context/StrategicMemoryContext';
import { useCausalGraph } from '@/context/CausalGraphContext';
import { usePropagation } from '@/context/PropagationContext';
import { useAgentTelemetry } from '@/context/AgentTelemetryContext';
import { useStrategicDirective } from '@/context/StrategicDirectiveContext';
import { TransportTelemetryPanel } from './TransportTelemetryPanel';

const iconMap: Record<string, React.ElementType> = {
  'Target Role Alignment': Activity,
  'Recruiter Confidence': Zap,
  'Career Velocity': BarChart3,
  'Opportunity Adjacency': Radar,
  'Execution Decay': Clock,
  'recruiter': Zap,
  'execution': Target,
  'market': Radar,
  'memory': Brain,
};

function CollapsibleModule({ title = "Module", icon: Icon, children = null, defaultOpen = false, className = "" }: { title: string, icon: React.ElementType, children: React.ReactNode, defaultOpen?: boolean, className?: string }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  if (!children) return null;

  return (
    <div className={`flex flex-col flex-grow ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3 lg:mb-4 lg:pointer-events-none"
      >
        <div className="flex items-center gap-2 text-slate-400">
          <Icon size={14} />
          <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
        </div>
        <div className="lg:hidden text-slate-500">
          {isOpen ? <X size={14} /> : <Menu size={14} />}
        </div>
      </button>
      {isOpen && (
        <div className="flex flex-col flex-grow animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
export default function DashboardV4() {
  const { status } = useAdaptiveRuntime();
  const { feed } = useMutationFeed();
  const { timeline } = useStrategicMemory();
  const { nodes, edges } = useCausalGraph();
  const { propagationFeed } = usePropagation();
  const { agents } = useAgentTelemetry();
  const { directive } = useStrategicDirective();

  const statusConfig = {
    CONNECTING: { color: 'bg-yellow-400/80 animate-pulse-subtle', text: 'Connecting...' },
    LIVE: { color: 'bg-emerald-400/80 animate-pulse-subtle', text: 'Orchestrator Active' },
    DEGRADED: { color: 'bg-amber-500/80 animate-pulse-subtle', text: 'Degraded Mode' },
    RECONNECTING: { color: 'bg-orange-500/80 animate-pulse-subtle', text: 'Reconnecting...' },
    PARTIAL_SYNC: { color: 'bg-blue-400/80 animate-pulse-subtle', text: 'Partial Sync' },
    OFFLINE: { color: 'bg-rose-500/80', text: 'Offline' },
  } as const;

  const currentStatus = (status?.toUpperCase() || 'CONNECTING') as keyof typeof statusConfig;
  const config = statusConfig[currentStatus] || statusConfig.CONNECTING;

  return (
    <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-8 h-full min-h-[85vh] flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Brain size={16} className="text-slate-400" />
          <h2 className="text-[13px] font-extrabold tracking-widest uppercase text-slate-300">Distributed Cognition Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {config.text}
          </span>
        </div>
      </div>

      {/* Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-4 lg:gap-6 flex-grow">

        {/* 1. Strategic Directive Console (Mobile: 1, Desktop: Center Top) */}
        <div className="order-1 lg:col-span-5 lg:col-start-4 lg:row-start-1 flex flex-col">
          <CollapsibleModule title="Strategic Directive Console" icon={ShieldAlert} defaultOpen={true}>
            {directive?.directive_type ? (
              <div className="rounded-xl border border-blue-500/30 bg-slate-900/50 p-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-900/20 border border-red-500/30 rounded text-red-400">
                    <Target size={12} />
                    <span className="text-[9px] uppercase font-bold tracking-widest">{directive.priority_level} PRIORITY</span>
                  </div>
                </div>
                <h3 className="text-lg font-extrabold tracking-tight text-white mb-2 max-w-[80%]">{directive?.directive_type ?? "Awaiting orchestration..."}</h3>
                <p className="text-[12px] text-slate-300 font-medium leading-relaxed mb-6 border-l-2 border-blue-500/50 pl-3">
                  {directive?.description ?? "No description available."}
                </p>
                <div className="flex flex-col gap-2 bg-[#020617] p-4 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Orchestration Rationale</span>
                  <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{directive?.rationale ?? "No rationale provided."}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 flex items-center justify-center min-h-[250px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">Awaiting orchestrator resolution...</span>
              </div>
            )}
          </CollapsibleModule>
        </div>

        {/* 2. Agent Activity Rail (Mobile: 2, Desktop: Right Top) */}
        <div className="order-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:pl-6 lg:border-l border-slate-800">
          <CollapsibleModule title="Agent Activity Rail" icon={Activity} defaultOpen={true}>
            <div className="space-y-3">
              {(Array.isArray(agents) ? agents : []).map((agent, i) => {
                const AgentIcon = iconMap[agent?.agent_id] || Brain;
                return (
                  <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border border-slate-800 bg-slate-900/40 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500/40" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AgentIcon size={12} className="text-blue-400" />
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">[{agent?.agent_id ?? "UNKNOWN"}]</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold tracking-widest">CONF: {(agent?.confidence ?? 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-200 font-bold tracking-tight block mb-1">{agent?.payload?.signal ?? "Processing..."}</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-mono">{agent?.payload?.details ?? "..."}</p>
                    </div>
                  </div>
                )
              })}
              {agents.length === 0 && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mt-2">No active cognition streams...</span>
              )}
            </div>
          </CollapsibleModule>
        </div>

        {/* 3. Propagation Constraints (Mobile: 3, Desktop: Right Bottom) */}
        <div className="order-3 lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:pl-6 lg:border-l border-slate-800 pt-2 lg:pt-0">
          <CollapsibleModule title="Propagation Constraints" icon={GitBranch} defaultOpen={false}>
            <div className="space-y-2">
              {(Array.isArray(propagationFeed) ? propagationFeed : []).map((prop, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded border border-slate-800 bg-slate-900/30">
                  <CheckCircle2 size={12} className="text-emerald-500/50 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      <span>{prop?.source ?? "UNKNOWN"}</span>
                      <ArrowRight size={8} className="text-slate-600" />
                      <span>{prop?.target ?? "UNKNOWN"}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{prop?.impact ?? "Pending impact assessment..."}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleModule>
        </div>

        {/* 4. Orchestration Topology (Mobile: 4, Desktop: Center Bottom) */}
        <div className="order-4 lg:col-span-5 lg:col-start-4 lg:row-start-2 pt-2 lg:pt-0">
          <CollapsibleModule title="Orchestration Topology" icon={Network} defaultOpen={false} className="h-full">
            <div className="rounded-xl border border-slate-800 bg-[#020617] p-4 min-h-[200px] flex flex-col justify-center items-center relative overflow-hidden flex-grow">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50" />
              {Array.isArray(nodes) && nodes.length > 0 ? (
                <div className="w-full space-y-5 z-10 px-4 py-4">
                  {(Array.isArray(edges) ? edges : []).map((edge, i) => {
                    const sourceNode = nodes.find(n => n.id === edge?.source);
                    const targetNode = nodes.find(n => n.id === edge?.target);
                    if (!sourceNode || !targetNode) return null;
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase">
                          <span className="text-slate-400">{sourceNode?.label ?? "Source"}</span>
                          <span className="text-[9px] text-emerald-400/80 bg-emerald-900/30 border border-emerald-500/20 px-1.5 py-0.5 rounded">{edge?.type ?? "link"}</span>
                          <span className="text-slate-400">{targetNode?.label ?? "Target"}</span>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#020617] px-2">
                            <ArrowRight size={10} className="text-slate-600" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Building causal map...</span>
              )}
            </div>
          </CollapsibleModule>
        </div>

        {/* 5. Historical Memory Timeline (Mobile: 5, Desktop: Left Span 2) */}
        <div className="order-5 lg:col-span-3 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:pr-6 lg:border-r border-slate-800 pt-2 lg:pt-0">
          <CollapsibleModule title="Strategic Memory" icon={GitCommit} defaultOpen={false}>
            <div className="space-y-5">
              {(Array.isArray(timeline) ? timeline : []).map((event, i) => (
                <div key={i} className="relative pl-4 border-l border-slate-700 pb-5 last:border-l-transparent last:pb-0">
                  <div className="absolute w-2 h-2 rounded-full border border-slate-500 bg-[#020617] -left-[4.5px] top-1" />
                  <h4 className="text-[11px] font-extrabold tracking-tight text-slate-200 mb-1">{event?.title ?? "Memory Event"}</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-2">{event?.description ?? "..."}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{event?.time ?? ""}</span>
                    <span className="text-[9px] text-blue-400/80 font-bold uppercase tracking-widest">CONF: {event?.confidence ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 mb-4">
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Activity size={14} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Live Mutations</span>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {(Array.isArray(feed) ? feed : []).map((log, i) => {
                  const Icon = iconMap[log?.signal] || Activity;
                  return (
                    <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-900/20 border border-blue-500/20">
                            <Icon size={12} className="text-blue-400" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{log?.signal ?? "Mutation"}</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">{log?.delta ?? ""}</span>
                      </div>
                      <div className="pl-8">
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{log?.reason ?? "..."}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <TransportTelemetryPanel />
          </CollapsibleModule>
        </div>

      </div>
    </div>
  );
}
