"use client";

import React from 'react';

export const PageContainer: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, actions, children }) => {
  return (
    <div className="py-6 sm:py-8 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-white/50 mt-1.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
