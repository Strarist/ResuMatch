'use client';

import { motion } from 'framer-motion';
import { Shield, BarChart3, Users, Award, TrendingUp } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion';
import Reveal from '../landing/Reveal';

const recruiterMetrics = [
  { label: 'Hiring Confidence', value: 94, icon: Shield, color: '#3b82f6' },
  { label: 'Execution Reliability', value: 91, icon: BarChart3, color: '#8b5cf6' },
  { label: 'Specialization Depth', value: 87, icon: Award, color: '#06b6d4' },
  { label: 'Proof Quality', value: 89, icon: TrendingUp, color: '#10b981' },
];

const candidates = [
  { name: 'You', score: 94, rank: 1, highlight: true },
  { name: 'Candidate B', score: 87, rank: 2, highlight: false },
  { name: 'Candidate C', score: 82, rank: 3, highlight: false },
  { name: 'Candidate D', score: 76, rank: 4, highlight: false },
];

export default function RecruiterSection() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-sm font-medium text-violet-400 mb-3">Recruiter Grade</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Built For Recruiters Who Need<br />Signal, Not Noise</h2>
          <p className="mt-4 text-white/40 max-w-lg mx-auto">Enterprise-grade candidate intelligence that surfaces proof-adjusted readiness and execution reliability.</p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {/* Left: Recruiter Dashboard Mockup */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <Users size={14} className="text-violet-400" />
              <span className="text-xs font-medium text-white/50">Candidate Ranking — Senior Engineer</span>
            </div>
            <div className="space-y-3">
              {candidates.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${c.highlight ? 'border-blue-400/20 bg-blue-500/[0.06]' : 'border-white/[0.04] bg-white/[0.01]'}`}
                >
                  <span className="text-[10px] font-mono text-white/30 w-4">#{c.rank}</span>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${c.highlight ? 'text-blue-300' : 'text-white/60'}`}>{c.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${c.highlight ? 'bg-gradient-to-r from-blue-400 to-violet-400' : 'bg-white/20'}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.score}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${c.highlight ? 'text-blue-300' : 'text-white/40'}`}>{c.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Confidence Metrics */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <Shield size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-white/50">Hiring Confidence Breakdown</span>
            </div>
            <div className="space-y-4">
              {recruiterMetrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                    <m.icon size={14} style={{ color: m.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-white/50">{m.label}</span>
                      <span className="text-xs font-bold text-white/70">{m.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: m.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.value}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 1 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
