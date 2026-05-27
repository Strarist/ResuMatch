'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

const variants = {
  primary: 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-400 hover:to-violet-400',
  secondary: 'border border-white/[0.1] text-white/70 hover:bg-white/[0.04] hover:text-white hover:border-white/[0.18]',
  ghost: 'text-white/50 hover:text-white hover:bg-white/[0.04]',
  glow: 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.25)] hover:shadow-[0_0_32px_rgba(59,130,246,0.35)] hover:from-blue-400 hover:to-violet-400',
  enterprise: 'bg-white/[0.04] border border-white/[0.1] text-white backdrop-blur-sm hover:bg-white/[0.08] hover:border-white/[0.2] shadow-xl shadow-black/20',
} as const;

interface PremiumButtonProps {
  href: string;
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
}

export default function PremiumButton({ href, variant = 'primary', children, className = '' }: PremiumButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-[1.02] ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
