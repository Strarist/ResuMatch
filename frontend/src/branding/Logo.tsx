"use client";

import React from 'react';
import { LogoMark, LogoMarkProps } from './LogoMark';

interface LogoProps extends LogoMarkProps {
  showWordmark?: boolean;
}

export function Logo({ size = 24, className = '', showWordmark = true, animate = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} animate={animate} />
      {showWordmark && (
        <span
          className="font-semibold tracking-[-0.01em] text-white"
          style={{ fontSize: Math.max(14, size * 0.65) }}
        >
          Skillyn
        </span>
      )}
    </div>
  );
}
