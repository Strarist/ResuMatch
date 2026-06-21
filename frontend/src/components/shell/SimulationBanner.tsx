'use client';

import { FlaskConical, X } from 'lucide-react';
import { useLivingSystem } from '@/context/LivingSystemContext';

export function SimulationBanner() {
  const { simulationActive, setSimulationActive, activePersona } = useLivingSystem();

  if (!simulationActive) return null;

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div>
          <p className="text-xs font-semibold text-amber-100">Simulation sandbox active</p>
          <p className="text-[11px] text-amber-200/70">
            Viewing sample data for {activePersona.name}. Upload a resume to switch to your real profile.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setSimulationActive(false)}
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-100 hover:bg-amber-500/20 transition-colors sm:self-center"
      >
        <X size={12} />
        Exit sandbox
      </button>
    </div>
  );
}
