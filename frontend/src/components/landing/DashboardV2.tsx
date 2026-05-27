'use client';

import { motion } from 'framer-motion';
import { Target, Radar, TrendingUp, UserCheck, Activity, Zap } from 'lucide-react';

const cards = [
  { icon: Target, label: 'Match Score', value: '94%', sub: '+3% this week', color: 'from-blue-400 to-cyan-400' },
  { icon: Radar, label: 'Skill Coverage', value: '12/14', sub: '2 gaps identified', color: 'from-violet-400 to-fuchsia-400' },
  { icon: TrendingUp, label: 'Salary Trajectory', value: '+23%', sub: 'vs. market avg', color: 'from-emerald-400 to-teal-400' },
  { icon: UserCheck, label: 'Recruiter Score', value: '8.7', sub: 'Top 15%', color: 'from-amber-400 to-orange-400' },
];

function MiniChart() {
  const bars = [35, 55, 45, 70, 60, 80, 75, 90, 85, 95];
  return (
    <div className="flex items-end gap-[3px] h-8">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-blue-400/60 to-blue-400/20"
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ delay: 1.2 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function ActivityFeed() {
  const items = [
    { icon: Zap, text: 'New match: Senior Engineer @ Stripe', time: '2m' },
    { icon: Activity, text: 'Skill gap closed: System Design', time: '1h' },
    { icon: TrendingUp, text: 'Market demand +12% for your stack', time: '3h' },
  ];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 + i * 0.2 }}
          className="flex items-center gap-2 text-[10px] text-white/40"
        >
          <item.icon size={10} className="text-blue-400/60" />
          <span className="truncate flex-1">{item.text}</span>
          <span className="text-white/20">{item.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardV2() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden lg:block"
    >
      <div className="relative w-full max-w-lg mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl" />

        {/* Main dashboard container */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-5 shadow-2xl shadow-black/30">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-white/50">Career Intelligence — Live</span>
            </div>
            <MiniChart />
          </div>

          {/* Metric cards grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {cards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    <card.icon size={12} className="text-white" />
                  </div>
                  <span className="text-[10px] text-white/40">{card.label}</span>
                </div>
                <p className="text-lg font-bold text-white">{card.value}</p>
                <p className="text-[10px] text-white/30">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Activity feed */}
          <div className="pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] font-medium text-white/30 mb-2">Recent Activity</p>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
