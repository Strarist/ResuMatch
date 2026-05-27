export const glass = {
  light: 'border border-white/[0.06] bg-white/[0.02] backdrop-blur-md shadow-lg shadow-black/10',
  medium: 'border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20',
  heavy: 'border border-white/[0.1] bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/30',
  interactive: 'border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-xl shadow-black/20 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300',
  panel: 'border border-white/[0.08] bg-[#0a0e18]/80 backdrop-blur-xl shadow-2xl shadow-black/40',
  floating: 'border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/30 ring-1 ring-white/[0.04]',
} as const;

export type GlassVariant = keyof typeof glass;
