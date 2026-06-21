import React, { ReactNode } from 'react';

/**
 * Shared two‑column layout for authentication pages.
 *
 * - `left`  – product story (StoryPanel)
 * - `right` – auth form (Login / Sign‑up)
 *
 * The layout is responsive:
 *   • lg and above → side‑by‑side columns
 *   • md to lg   → stacked with a small gap
 *   • sm and below → single column, left panel on top
 */
export interface AuthLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function AuthLayout({ left, right }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Left panel – hidden on small screens */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-white/[0.08] relative bg-black">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-transparent pointer-events-none" />
        <div className="relative z-10 animate-fade-in">{left}</div>
      </div>

      {/* Right panel – always visible */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="w-full max-w-sm">{right}</div>
      </div>
    </div>
  );
}
