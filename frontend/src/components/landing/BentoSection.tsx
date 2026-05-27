'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, Compass, UserCheck, Map, Radar, CheckCircle, Cpu } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion';
import Reveal from './Reveal';

const bentoItems = [
  { icon: FileText, title: 'Resume Intelligence', description: 'Deep semantic parsing with skill extraction and confidence scoring', span: 'md:col-span-2', metric: '94% accuracy' },
  { icon: TrendingUp, title: 'Market Intelligence', description: 'Real-time salary data and demand signals across industries', span: '', metric: '2.4k signals' },
  { icon: Compass, title: 'Career Trajectory', description: 'AI-projected growth paths based on your skill graph', span: '', metric: '5yr forecast' },
  { icon: UserCheck, title: 'Recruiter Intelligence', description: 'Understand what recruiters prioritize for your target roles', span: 'md:col-span-2', metric: '89% match' },
  { icon: Map, title: 'Strategic Planning', description: 'Gap analysis and personalized upskilling roadmaps', span: '', metric: '12 paths' },
  { icon: Radar, title: 'Opportunity Radar', description: 'Continuous scanning for roles matching your career graph', span: '', metric: 'Live' },
  { icon: CheckCircle, title: 'Execution Tracking', description: 'Track applications, interviews, and outcomes in one view', span: '', metric: '3x velocity' },
  { icon: Cpu, title: 'AI Workspace', description: 'Cover letters, prep notes, and strategy generated on demand', span: 'md:col-span-2', metric: '<2s gen' },
];

export default function BentoSection() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-sm font-medium text-cyan-400 mb-3">Ecosystem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Career Intelligence Ecosystem
          </h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">
            Eight interconnected intelligence modules working together to compound your career advantage.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {bentoItems.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className={`group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500 ${item.span}`}
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.06),transparent_60%)]" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <item.icon size={16} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] font-mono text-white/30 px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02]">
                    {item.metric}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
