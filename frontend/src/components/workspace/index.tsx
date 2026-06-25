'use client';

import { motion } from 'framer-motion';
import { Panel } from '@/components/ds/primitives';
import { Button } from '@/components/ui/button';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { Play } from 'lucide-react';

// === PageContainer ===
export function PageContainer({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
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
    <div className={`rounded-xl border border-border bg-surface-raised backdrop-blur-sm p-5 ${className}`}>
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
      className={`rounded-xl border p-4 transition-all duration-500 bg-surface-raised border-border ${highlight ? '' : ''}`}
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
        <span className="text-xs text-text-secondary">{label}</span>
        {Icon && (
          <span
            className="transition-colors duration-500"
            style={{ color: highlight ? color : undefined }}
          >
            <Icon size={14} className={highlight ? '' : 'text-text-tertiary'} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold transition-colors duration-500 ${highlight ? '' : 'text-text'}`}
          style={highlight ? { color } : undefined}
        >
          {value}
        </span>
        {delta && <span className="text-xs text-success">{delta}</span>}
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
    <div className={`rounded-2xl border border-border bg-surface-raised/80 backdrop-blur-xl p-6 shadow-md ${className}`}>
      {children}
    </div>
  );
}

// === SectionLabel ===
export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-text-secondary mb-3">{children}</h2>;
}

// === InsightPanel ===
export function InsightPanel({ title, confidence, children }: { title: string; confidence?: number; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text">{title}</span>
        {confidence !== undefined && (
          <span className="text-[10px] font-mono text-info px-1.5 py-0.5 rounded border border-info/20 bg-info/5">{confidence}%</span>
        )}
      </div>
      <div className="text-xs text-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

// === ActivityItem ===
export function ActivityItem({ icon: Icon, text, time }: { icon: React.ComponentType<{ size?: number; className?: string }>; text: string; time: string }) {
  return (
    <div className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-surface-inset transition-colors">
      <Icon size={12} className="text-info/60 flex-shrink-0" />
      <span className="text-xs text-text-secondary truncate flex-1">{text}</span>
      <span className="text-[10px] text-text-tertiary flex-shrink-0">{time}</span>
    </div>
  );
}

// === EmptyState ===
export function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; description: string }) {
  const { setSimulationActive } = useLivingSystem();

  return (
    <div className="relative rounded-2xl border border-border bg-surface-raised/80 backdrop-blur-xl p-8 max-w-lg mx-auto overflow-hidden shadow-lg my-8">
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center mb-6">
          <span className="absolute inline-flex h-16 w-16 rounded-full bg-accent/10 animate-ping opacity-60" />
          <div className="w-14 h-14 rounded-2xl border border-border bg-surface-inset flex items-center justify-center shadow-md">
            <Icon size={22} className="text-accent/70" />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-text tracking-wide uppercase mb-2">{title}</h3>
        <p className="text-xs text-text-secondary max-w-xs leading-relaxed mb-6">{description}</p>

        <div className="w-full text-left font-mono text-[10px] text-text-tertiary bg-surface-inset rounded-lg p-4 border border-border mb-6 space-y-1">
          <div className="flex items-center gap-1.5 text-info">
            <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
            <span>STATUS: Awaiting Upload</span>
          </div>
          <div>SKILLYN ENGINE: STANDBY</div>
          <div>AWAITING RESUME UPLOAD...</div>
        </div>

        <button
          onClick={() => setSimulationActive(true)}
          className="group relative flex items-center gap-2 px-5 py-2.5 rounded-lg border border-accent/30 bg-accent/10 text-[11px] font-semibold text-accent tracking-wider uppercase hover:border-accent/50 hover:bg-accent/15 active:scale-95 transition-all duration-200"
        >
          <Play size={11} className="group-hover:translate-x-0.5 transition-transform" />
          Explore Sandbox / Sample Profile
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
        <div key={i} className="h-4 rounded-lg bg-surface-inset" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}
export { Panel, Button };
