'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isDevModeEnabled } from '@/lib/dev-mode';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', group: 'Navigation', action: () => router.push('/dashboard') },
    { id: 'nav-resumes', label: 'Go to Resumes', group: 'Navigation', action: () => router.push('/resumes') },
    { id: 'nav-cover', label: 'Go to Cover Letter', group: 'Navigation', action: () => router.push('/cover-letter') },
    { id: 'nav-roadmap', label: 'Go to Roadmap', group: 'Navigation', action: () => router.push('/roadmap-v2') },
    { id: 'nav-settings', label: 'Go to Settings', group: 'Navigation', action: () => router.push('/settings') },
    { id: 'action-upload', label: 'Upload Resume', group: 'Actions', action: () => router.push('/resumes?upload=true') },
    ...(isDevModeEnabled()
      ? [
          { id: 'nav-analysis', label: 'Go to Analysis (Dev)', group: 'Dev', action: () => router.push('/analysis') },
          { id: 'action-analyze', label: 'New Analysis (Dev)', group: 'Dev', action: () => router.push('/analysis') },
        ]
      : []),
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const execute = useCallback((item: CommandItem) => {
    item.action();
    setOpen(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      execute(filtered[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg animate-scale-in rounded-xl border border-border bg-surface-raised shadow-xl">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon className="h-4 w-4 text-text-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-3.5 text-body text-text outline-none placeholder:text-text-tertiary"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-text-tertiary">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-small text-text-tertiary">No results found</p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => execute(item)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-small transition-colors',
                i === selectedIndex ? 'bg-accent-subtle text-accent' : 'text-text-secondary hover:bg-surface-overlay'
              )}
            >
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-text-tertiary">{item.group}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-xs text-text-tertiary">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}
