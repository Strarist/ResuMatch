'use client';

import { motion } from 'framer-motion';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Play } from 'lucide-react';

// === PageContainer ===
export function PageContainer({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

// === WorkspaceCard ===
export function WorkspaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

// === MetricCard ===
export function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  sparklineData,
  color = '#3b82f6',
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  sparklineData?: number[];
  color?: string;
}) {
  const [highlight, setHighlight] = useState(false);
  const prevVal = useRef(value);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (prevVal.current !== value) {
      setHighlight(true);
      t = setTimeout(() => setHighlight(false), 800);
      prevVal.current = value;
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [value]);

  // Calculate SVG sparkline if data is provided
  let sparklineElement = null;
  if (sparklineData && sparklineData.length > 1) {
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const pathPoints = sparklineData.map((v, i) => {
      const x = (i / (sparklineData.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 20 - 5;
      return `${x} ${y}`;
    });
    const linePath = `M ${pathPoints.join(' L ')}`;
    const fillPath = `${linePath} L 100 30 L 0 30 Z`;
    const gradientId = `grad-${label.replace(/\s+/g, '-').toLowerCase()}`;

    sparklineElement = (
      <svg viewBox="0 0 100 30" className="w-full h-8 mt-3 animate-fade-in" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 transition-all duration-500 bg-white/[0.02] border-white/[0.06]"
      style={
        highlight
          ? {
              borderColor: `${color}40`,
              backgroundColor: `${color}03`,
              boxShadow: `0 0 15px ${color}10`,
            }
          : {}
      }
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">{label}</span>
        {Icon && (
          <span
            className="transition-colors duration-500"
            style={{ color: highlight ? color : 'rgba(255,255,255,0.2)' }}
          >
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold transition-colors duration-500"
          style={{ color: highlight ? color : '#ffffff' }}
        >
          {value}
        </span>
        {delta && <span className="text-xs text-emerald-400">{delta}</span>}
      </div>
      {sparklineElement}
    </div>
  );
}


// === DashboardGrid ===
export function DashboardGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }[cols];
  return <div className={`grid grid-cols-1 ${colClass} gap-4`}>{children}</div>;
}

// === GlassPanel ===
export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.08] bg-[#0a0e18]/60 backdrop-blur-xl p-6 shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

// === SectionLabel ===
export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-white/70 mb-3">{children}</h2>;
}

// === InsightPanel ===
export function InsightPanel({ title, confidence, children }: { title: string; confidence?: number; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{title}</span>
        {confidence !== undefined && (
          <span className="text-[10px] font-mono text-blue-400/70 px-1.5 py-0.5 rounded border border-blue-400/20 bg-blue-500/[0.06]">{confidence}%</span>
        )}
      </div>
      <div className="text-xs text-white/40 leading-relaxed">{children}</div>
    </div>
  );
}

// === ActivityItem ===
export function ActivityItem({ icon: Icon, text, time }: { icon: React.ComponentType<{ size?: number; className?: string }>; text: string; time: string }) {
  return (
    <div className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
      <Icon size={12} className="text-blue-400/50 flex-shrink-0" />
      <span className="text-xs text-white/40 truncate flex-1">{text}</span>
      <span className="text-[10px] text-white/20 flex-shrink-0">{time}</span>
    </div>
  );
}

// === EmptyState ===
export function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; description: string }) {
  const { setSimulationActive } = useLivingSystem();

  return (
    <div className="relative rounded-2xl border border-white/[0.05] bg-[#070b13]/60 backdrop-blur-xl p-8 max-w-lg mx-auto overflow-hidden shadow-2xl shadow-black/40 my-8">
      {/* Decorative cyber grid scan effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Breathing animated pulse icon */}
        <div className="relative flex items-center justify-center mb-6">
          <span className="absolute inline-flex h-16 w-16 rounded-full bg-blue-500/[0.06] animate-ping opacity-60" />
          <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-[#080d16] flex items-center justify-center shadow-lg shadow-black/20">
            <Icon size={22} className="text-blue-400/60" />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white/80 tracking-wide uppercase mb-2">{title}</h3>
        <p className="text-xs text-white/35 max-w-xs leading-relaxed mb-6">{description}</p>

        {/* Diagnostic Terminal */}
        <div className="w-full text-left font-mono text-[10px] text-white/20 bg-black/40 rounded-lg p-4 border border-white/[0.04] mb-6 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>SYSTEM_STATUS: SECURE_STANDBY</span>
          </div>
          <div>CORE_ORCHESTRATOR: ONLINE</div>
          <div>AWAITING PROFILE HYDRATION...</div>
          <div className="text-white/10 mt-2">{"// Telemetry endpoints listening."}</div>
          <div className="text-white/10">{"// Deploy resume to activate full-stack career pipeline."}</div>
        </div>

        {/* Simulation Sandbox Button */}
        <button
          onClick={() => setSimulationActive(true)}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-lg border border-blue-400/20 bg-blue-500/[0.06] text-[11px] font-semibold text-blue-300 tracking-wider uppercase hover:border-blue-400/50 hover:bg-blue-500/[0.12] active:scale-95 transition-all duration-200"
        >
          <Play size={11} className="text-blue-300 group-hover:translate-x-0.5 transition-transform" />
          Activate Simulated Telemetry
        </button>
      </div>
    </div>
  );
}


// === LoadingPulse ===
export function LoadingPulse({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded-lg bg-white/[0.04]" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}
