"use client";

import React, { useEffect, useState } from 'react';

export interface LogoMarkProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function LogoMark({ size = 24, className = '', animate = true }: LogoMarkProps) {
  // Sync pulse every 10 seconds
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 2000); // 2 second pulse duration
      return () => clearTimeout(timeout);
    }, 10000); // 10 second gap
    return () => clearInterval(interval);
  }, [animate]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-opacity duration-300`}
    >
      {/* Background Boundary - Dark mode structural base */}
      <rect x="2" y="2" width="44" height="44" rx="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.15" />

      {/*
        Intelligence Stack Geometry
        Option C: Inputs -> Processing -> Orchestration -> Output
      */}

      {/* Layer 1: Inputs (Bottom) */}
      <rect
        x="12" y="32" width="24" height="4" rx="1" fill="currentColor"
        className="transition-all duration-1000 ease-in-out"
        style={{ fillOpacity: pulse ? 0.4 : 0.2 }}
      />
      <rect
        x="16" y="26" width="16" height="4" rx="1" fill="currentColor"
        className="transition-all duration-1000 ease-in-out"
        style={{ fillOpacity: pulse ? 0.6 : 0.4, transitionDelay: '200ms' }}
      />
      <rect
        x="20" y="20" width="8" height="4" rx="1" fill="currentColor"
        className="transition-all duration-1000 ease-in-out"
        style={{ fillOpacity: pulse ? 0.95 : 0.7, transitionDelay: '400ms' }}
      />

      {/* Top Node - Output/Orchestration */}
      <circle
        cx="24" cy="12" r="3" fill="#60A5FA" // blue-400
        className="transition-transform duration-1000 ease-in-out"
        style={{
          transform: pulse ? 'scale(1.2)' : 'scale(1)',
          transformOrigin: '24px 12px'
        }}
      />

      {/* Signal Lines connecting the stack */}
      <path d="M24 16L24 20" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M24 24L24 26" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M24 30L24 32" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
    </svg>
  );
}
