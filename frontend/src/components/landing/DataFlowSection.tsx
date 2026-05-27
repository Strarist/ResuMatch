'use client';

import { motion } from 'framer-motion';
import { FileText, Brain, Compass, UserCheck, Radar, Rocket } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion';
import Reveal from './Reveal';

const flowNodes = [
  { icon: FileText, label: 'Resume', color: '#3b82f6' },
  { icon: Brain, label: 'Intelligence', color: '#8b5cf6' },
  { icon: Compass, label: 'Trajectory', color: '#06b6d4' },
  { icon: UserCheck, label: 'Recruiter Signals', color: '#10b981' },
  { icon: Radar, label: 'Opportunities', color: '#f59e0b' },
  { icon: Rocket, label: 'Career Evolution', color: '#ec4899' },
];

export default function DataFlowSection() {
  return (
    <section className="py-32 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-20">
          <p className="text-sm font-medium text-fuchsia-400 mb-3">Intelligence Flow</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Intelligence In Motion</h2>
          <p className="mt-4 text-white/40 max-w-lg mx-auto">Watch your data evolve through six intelligence layers, each compounding the signal for the next.</p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative"
        >
          {/* Flow connector line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-y-1/2 hidden md:block" aria-hidden="true" />

          {/* Animated pulse along the line */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-16 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent hidden md:block"
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {flowNodes.map((node, i) => (
              <motion.div
                key={node.label}
                variants={fadeUp}
                className="flex flex-col items-center text-center group"
              >
                {/* Node */}
                <motion.div
                  whileHover={{ scale: 1.1, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="relative mb-3"
                >
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border"
                    style={{ borderColor: `${node.color}20` }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex items-center justify-center group-hover:border-opacity-30 transition-all duration-300 shadow-lg shadow-black/20"
                    style={{ ['--hover-border' as string]: node.color }}
                  >
                    <node.icon size={20} style={{ color: node.color }} className="opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Data particle */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: node.color }}
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  />
                </motion.div>

                {/* Label */}
                <span className="text-[10px] font-medium text-white/40 group-hover:text-white/70 transition-colors">
                  {node.label}
                </span>

                {/* Step number */}
                <span className="text-[8px] text-white/15 font-mono mt-1">0{i + 1}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
