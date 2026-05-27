'use client';

import { motion } from 'framer-motion';
import { Star, TrendingUp, Award, Zap, Eye, Rocket } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion';
import Reveal from '../landing/Reveal';

const milestones = [
  { icon: Star, label: 'Skill Foundation', period: 'Month 1-2', description: 'AI maps your complete skill graph and identifies high-leverage gaps', metric: '+14 skills mapped' },
  { icon: TrendingUp, label: 'Market Positioning', period: 'Month 2-4', description: 'Strategic alignment with market demand signals and salary benchmarks', metric: '+23% salary potential' },
  { icon: Award, label: 'Specialization Depth', period: 'Month 4-6', description: 'Focused upskilling on high-demand specializations with proof artifacts', metric: '3 certifications' },
  { icon: Eye, label: 'Recruiter Visibility', period: 'Month 6-9', description: 'Optimized presence surfaces you to relevant hiring pipelines', metric: '4x inbound interest' },
  { icon: Zap, label: 'Execution Velocity', period: 'Month 9-12', description: 'Automated applications, prep, and follow-ups accelerate your pipeline', metric: '12 interviews/mo' },
  { icon: Rocket, label: 'Career Compounding', period: 'Year 1+', description: 'Continuous intelligence compounds your advantage over time', metric: 'Top 5% trajectory' },
];

export default function TimelineSection() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-20">
          <p className="text-sm font-medium text-amber-400 mb-3">Evolution</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Career Compounding in Motion</h2>
          <p className="mt-4 text-white/40 max-w-lg mx-auto">Watch your career advantage compound through six phases of intelligent growth.</p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="relative"
        >
          {/* Vertical connector */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-violet-500/30 to-amber-500/30" aria-hidden="true" />

          <div className="space-y-6">
            {milestones.map((m, i) => (
              <motion.div key={m.label} variants={fadeUp} className="relative flex gap-5 md:gap-8 group">
                {/* Node */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    whileInView={{ scale: [0.8, 1.1, 1] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm flex items-center justify-center group-hover:border-blue-400/30 group-hover:bg-blue-500/[0.06] transition-all duration-300"
                  >
                    <m.icon size={18} className="text-white/50 group-hover:text-blue-400 transition-colors" />
                  </motion.div>
                  {/* Glow dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-violet-400 shadow-sm shadow-blue-400/40"
                  />
                </div>

                {/* Content */}
                <div className="pt-1 pb-6 flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    <span className="text-[10px] font-mono text-white/25">{m.period}</span>
                    <h3 className="text-sm font-semibold text-white">{m.label}</h3>
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed mb-2 max-w-md">{m.description}</p>
                  <span className="inline-flex text-[10px] font-medium text-emerald-400/80 px-2 py-0.5 rounded-full border border-emerald-400/20 bg-emerald-500/[0.06]">
                    {m.metric}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
