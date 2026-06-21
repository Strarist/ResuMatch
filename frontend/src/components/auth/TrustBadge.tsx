import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

/**
 * Displays a set of brief trust statements with a shield icon.
 * Up to four messages are shown side‑by‑side.
 */
export function TrustBadge({ messages }: { messages: string[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-white/30 mt-6">
      {messages.map((msg, i) => (
        <div key={i} className="flex items-center gap-1">
          <ShieldCheckIcon className="w-3 h-3 text-white/50" />
          <span className="text-white/60">{msg}</span>
        </div>
      ))}
    </div>
  );
}
