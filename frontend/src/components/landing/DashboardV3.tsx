'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, UserCheck, Activity, Zap, Radar, BarChart3, Cpu } from 'lucide-react';

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 80}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

const topMetrics = [
  { icon: Target, label: 'Match Score', value: '94%', delta: '+3%', color: '#3b82f6', spark: [40, 55, 48, 62, 58, 72, 68, 80, 85, 94] },
  { icon: UserCheck, label: 'Recruiter Score', value: '8.7/10', delta: '+0.4', color: '#8b5cf6', spark: [60, 62, 65, 68, 72, 75, 78, 82, 85, 87] },
  { icon: TrendingUp, label: 'Career Velocity', value: '78%', delta: '+12%', color: '#06b6d4', spark: [30, 35, 42, 48, 55, 60, 65, 70, 74, 78] },
  { icon: Radar, label: 'Market Fit', value: '91%', delta: '+5%', color: '#10b981', spark: [55, 60, 65, 70, 75, 78, 82, 85, 88, 91] },
];

const feed = [
  { icon: Zap, text: 'New match: Staff Engineer @ Linear', time: '2m', type: 'match' },
  { icon: Activity, text: 'Skill verified: Distributed Systems', time: '1h', type: 'skill' },
  { icon: BarChart3, text: 'Market demand +18% for your stack', time: '3h', type: 'market' },
  { icon: Cpu, text: 'Cover letter generated for Vercel role', time: '5h', type: 'auto' },
];

export default function DashboardV3() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden lg:block"
    >
      <div className="relative w-full max-w-lg mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-violet-500/4 to-transparent rounded-3xl blur-3xl" />

        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0e18]/80 backdrop-blur-xl p-5 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-medium text-white/40">Career Intelligence — Live</span>
            </div>
            <span className="text-[9px] text-white/20 font-mono">v3.2.1</span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {topMetrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <m.icon size={10} style={{ color: m.color }} />
                  <span className="text-[9px] text-white/35">{m.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-white">{m.value}</span>
                  <span className="text-[9px] text-emerald-400">{m.delta}</span>
                </div>
                <div className="mt-1.5">
                  <MiniSparkline data={m.spark} color={m.color} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="pt-3 border-t border-white/[0.04]">
            <p className="text-[9px] font-medium text-white/25 uppercase tracking-wider mb-2">Activity Stream</p>
            <div className="space-y-1.5">
              {feed.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.12 }}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <item.icon size={10} className="text-blue-400/50 flex-shrink-0" />
                  <span className="text-[10px] text-white/40 truncate flex-1">{item.text}</span>
                  <span className="text-[9px] text-white/20 flex-shrink-0">{item.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
