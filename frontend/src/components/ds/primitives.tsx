'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// === Panel: Primary container primitive ===

interface PanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'raised' | 'inset' | 'ghost';
}

export function Panel({ children, className, variant = 'default' }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border p-6 transition-colors duration-200',
        variant === 'default' && 'bg-surface-raised',
        variant === 'raised' && 'bg-surface-overlay shadow-md',
        variant === 'inset' && 'bg-surface-inset border-border-subtle',
        variant === 'ghost' && 'border-transparent bg-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}

// === StreamingBlock: Container for AI-generated streaming content ===

interface StreamingBlockProps {
  children: ReactNode;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingBlock({ children, isStreaming, className }: StreamingBlockProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-border-subtle bg-surface-inset p-5 font-mono text-small',
        'whitespace-pre-wrap leading-relaxed',
        isStreaming && 'border-accent/30',
        className
      )}
    >
      {children}
      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse-subtle bg-accent" />
      )}
    </div>
  );
}

// === ScoreRing: Circular score display ===

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({ score, size = 80, label, className }: ScoreRingProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? 'hsl(var(--success))' :
    score >= 50 ? 'hsl(var(--warning))' :
    'hsl(var(--error))';

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--border))" strokeWidth="4"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out-expo"
        />
      </svg>
      <span className="absolute text-h3 font-semibold text-text">{Math.round(score)}</span>
      {label && <span className="text-xs text-text-tertiary">{label}</span>}
    </div>
  );
}

// === SectionHeader: Consistent section titles ===

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-h2 text-text">{title}</h2>
        {subtitle && <p className="mt-0.5 text-small text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// === StatusBadge: Semantic status indicator ===

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'success' && 'bg-success/10 text-success',
        status === 'warning' && 'bg-warning/10 text-warning',
        status === 'error' && 'bg-error/10 text-error',
        status === 'info' && 'bg-info/10 text-info',
        status === 'neutral' && 'bg-surface-raised text-text-secondary',
      )}
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'success' && 'bg-success',
        status === 'warning' && 'bg-warning',
        status === 'error' && 'bg-error',
        status === 'info' && 'bg-info',
        status === 'neutral' && 'bg-text-tertiary',
      )} />
      {children}
    </span>
  );
}

// === Skeleton: Loading placeholder ===

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}
