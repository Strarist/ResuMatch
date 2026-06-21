import React from 'react';

/**
 * Horizontal divider with a centered label (e.g., "OR").
 * Matches the styling used in the existing auth pages.
 */
export function DividerWithLabel({ label }: { label: string }) {
  return (
    <div className="relative my-6 flex items-center">
      <div className="flex-grow border-t border-white/[0.08]" />
      <span className="flex-shrink-0 px-4 text-xs text-white/20">{label}</span>
      <div className="flex-grow border-t border-white/[0.08]" />
    </div>
  );
}
