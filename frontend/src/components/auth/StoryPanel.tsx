import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ClickableLogo } from '@/components/common/ClickableLogo';


export interface StoryPanelProps {
  /** Main headline, e.g. "Welcome back to Skillyn" */
  headline: string;
  /** Sub‑headline that gives a brief value proposition */
  subheadline: string;
  /** Optional bullet points highlighting key product features */
  highlights?: string[];
  /** Optional extra content – typically the AuthPreviewCard */
  children?: ReactNode;
}

/**
 * Left‑hand story panel used on auth pages.
 * It renders the logo, headline, sub‑headline, an optional feature list,
 * and any extra children (e.g., a preview card).
 */
export function StoryPanel({ headline, subheadline, highlights, children }: StoryPanelProps) {
  return (
    <div className="space-y-8">
      {/* Logo */}
      <Link href="/" className="inline-flex">
        <ClickableLogo size={40} showWordmark={true} className="opacity-80 hover:opacity-100 transition-opacity" />
      </Link>

      {/* Text */}
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-2">{headline}</h1>
        <p className="text-white/40 text-lg font-light max-w-md">{subheadline}</p>
        {highlights && highlights.length > 0 && (
          <ul className="list-disc list-inside space-y-1 text-sm text-white/60 mt-4">
            {highlights.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Optional preview or extra content */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
