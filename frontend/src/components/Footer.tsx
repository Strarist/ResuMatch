import Link from 'next/link';
import { Activity, Network, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-[#020617] border-t border-slate-800 py-12 mt-16 relative overflow-hidden">
      {/* Subtle grid background for infrastructural feel */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">

          {/* Column 1: System Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-slate-400" />
              <span className="text-[12px] font-extrabold tracking-widest text-slate-300 uppercase">Skillyn Engine</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium max-w-xs">
              Strategic career optimization platform and operational intelligence tool for advanced software engineers.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500/80 tracking-widest uppercase">Systems Operational</span>
            </div>
          </div>

          {/* Column 2: Trajectory Engine */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Trajectory Engine</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
                <Activity size={12} />
                <span className="text-[12px] font-semibold tracking-wide">Optimization Engine</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
                <Network size={12} />
                <span className="text-[12px] font-semibold tracking-wide">Trajectory Map</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
                <Shield size={12} />
                <span className="text-[12px] font-semibold tracking-wide">Determinism Validator</span>
              </div>
            </div>
          </div>

          {/* Column 3: Documentation */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">System Documentation</h4>
            <div className="flex flex-col gap-3">
              <Link href="/docs/architecture" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 tracking-wide transition-colors">Architecture</Link>
              <Link href="/docs/agents" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 tracking-wide transition-colors">Career Pathways</Link>
              <Link href="/docs/api" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 tracking-wide transition-colors">API Reference</Link>
            </div>
          </div>

          {/* Column 4: Links */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">External Subsystems</h4>
            <div className="flex flex-col gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 hover:text-slate-200 tracking-wide transition-colors">
                Source Repository
                <ExternalLink size={12} />
              </a>
              <Link href="/status" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 tracking-wide transition-colors">Status Dashboard</Link>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
            © {new Date().getFullYear()} SKILLYN SYSTEMS
          </div>
          <div className="text-[10px] font-mono text-slate-700">
            v10.3.0-STABLE
          </div>
        </div>
      </div>
    </footer>
  );
}
