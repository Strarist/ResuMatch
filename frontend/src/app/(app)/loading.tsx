'use client';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-48 rounded-lg bg-white/[0.04]" />
      <div className="h-4 w-32 rounded-lg bg-white/[0.03]" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.04]" />)}
      </div>
      <div className="h-64 rounded-2xl bg-white/[0.02] border border-white/[0.04]" />
    </div>
  );
}
