"use client";

import React from 'react';

type LayoutVariant = 'narrow' | 'standard' | 'wide' | 'ultra' | 'dashboard';

interface LayoutProps {
  variant?: LayoutVariant;
  children: React.ReactNode;
  className?: string;
}

const layoutWidths: Record<LayoutVariant, string> = {
  narrow: 'max-w-[768px]',
  standard: 'max-w-[1024px]',
  wide: 'max-w-[1200px]',
  ultra: 'max-w-[1440px]',
  dashboard: 'max-w-[1520px]',
};

export const Layout: React.FC<LayoutProps> = ({
  variant = 'standard',
  children,
  className = ''
}) => {
  const widthClass = layoutWidths[variant];
  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${widthClass} ${className}`}>
      {children}
    </div>
  );
};

// Keeping backwards compatibility for any references before refactoring
export const LayoutUltra = ({ children, className }: LayoutProps) => <Layout variant="ultra" className={className}>{children}</Layout>;
export const LayoutDashboard = ({ children, className }: LayoutProps) => <Layout variant="dashboard" className={className}>{children}</Layout>;
