'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = '✨', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <span className="text-4xl">{icon}</span>
      <h3 className="mt-4 text-h3 text-text">{title}</h3>
      <p className="mt-1 max-w-sm text-small text-text-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
