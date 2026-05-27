'use client';

import { motion } from 'framer-motion';
import { Target, Radar, TrendingUp, UserCheck } from 'lucide-react';

const cards = [
  { icon: Target, label: 'Match Score', value: '94%', color: 'from-blue-400 to-cyan-400', delay: 0.3 },
  { icon: Radar, label: 'Skill Radar', value: '12 Skills', color: 'from-violet-400 to-fuchsia-400', delay: 0.5 },
  { icon: TrendingUp, label: 'Salary Growth', value: '+23%', color: 'from-emerald-400 to-teal-400', delay: 0.7 },
  { icon: UserCheck, label: 'Recruiter Confidence', value: 'High', color: 'from-amber-400 to-orange-400', delay: 0.9 },
];

export default function DashboardVisualization() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative hidden lg:block"
    >
      <div className="relative w-full aspect-square max-w-lg mx-auto">
        {/* Ambient glow behind cards */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent rounded-3xl blur-3xl" />

        {/* Floating cards */}
        {cards.map((card, i) => {
          const positions = [
            'top-[5%] left-[5%]',
            'top-[5%] right-[5%]',
            'bottom-[15%] left-[5%]',
            'bottom-[15%] right-[5%]',
          ];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: card.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute ${positions[i]} w-[45%]`}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-xl shadow-black/20 group cursor-default"
              >
                {/* Glow border on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/10 to-violet-500/10" />

                <div className="relative flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} shadow-lg`}>
                    <card.icon size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40 font-medium">{card.label}</p>
                    <p className="text-sm font-semibold text-white">{card.value}</p>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="mt-3 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${60 + i * 10}%` }}
                    transition={{ delay: card.delay + 0.5, duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}

        {/* Center connector element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border border-dashed border-blue-400/30"
          />
        </div>
      </div>
    </motion.div>
  );
}
