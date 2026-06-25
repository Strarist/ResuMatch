import { Target, Award, Compass, FileText } from 'lucide-react';

const previewMetrics = [
  { label: 'Match Score', value: '85%', icon: Target, accent: 'text-emerald-400' },
  { label: 'Roadmap Progress', value: '45%', icon: Award, accent: 'text-sky-400' },
  { label: 'Top Opportunity', value: 'Data Engineer', icon: Compass, accent: 'text-violet-400' },
  { label: 'Market Insight', value: 'Talent demand ↑', icon: FileText, accent: 'text-amber-400' },
] as const;

/** Dark-themed preview card for auth pages — avoids light theme token bleed. */
export function AuthPreviewCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 space-y-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      {previewMetrics.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/45">{label}</p>
            <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
          </div>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
      ))}
    </div>
  );
}
