'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, Compass, UserCheck, Map, Radar, CheckCircle, Cpu } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion';
import Reveal from './Reveal';

const items = [
  { icon: FileText, title: 'Resume Intelligence', desc: 'Deep semantic parsing with confidence scoring', span: 'md:col-span-2 md:row-span-2', metric: '94%', status: 'active' },
  { icon: TrendingUp, title: 'Market Intelligence', desc: 'Real-time salary and demand signals', span: '', metric: '2.4k', status: 'processing' },
  { icon: Compass, title: 'Career Trajectory', desc: 'AI-projected growth paths', span: '', metric: '5yr', status: 'active' },
  { icon: UserCheck, title: 'Recruiter Intelligence', desc: 'Recruiter priority analysis', span: 'md:col-span-2', metric: '89%', status: 'active' },
  { icon: Map, title: 'Strategic Planning', desc: 'Gap analysis and roadmaps', span: '', metric: '12', status: 'idle' },
  { icon: Radar, title: 'Opportunity Radar', desc: 'Continuous role scanning', span: '', metric: 'Live', status: 'processing' },
  { icon: CheckCircle, title: 'Execution Tracking', desc: 'Pipeline and outcomes', span: '', metric: '3x', status: 'active' },
  { icon: Cpu, title: 'AI Workspace', desc: 'On-demand generation', span: 'md:col-span-2', metric: '<2s', status: 'idle' },
];

const statusColors: Record<string, string> = { active: 'bg-emerald-400', processing: 'bg-blue-400', idle: 'bg-white/20' };

export default function BentoV3Section() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-sm font-medium text-cyan-400 mb-3">Ecosystem</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Career Intelligence Ecosystem</h2>
          <p className="mt-4 text-white/40 max-w-xl mx-auto">Eight interconnected intelligence modules compounding your career advantage.</p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.25 } }}
              className={`group relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-400 overflow-hidden ${item.span}`}
            >
              {/* Hover spotlight */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-600 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent_60%)]" />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:border-blue-400/20 transition-all duration-300">
                      <item.icon size={14} className="text-blue-400/80" />
                    </div>
                    {/* Live status indicator */}
                    <motion.div
                      className={`w-1.5 h-1.5 rounded-full ${statusColors[item.status]}`}
                      animate={item.status === 'processing' ? { opacity: [1, 0.3, 1] } : item.status === 'active' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white/70">{item.metric}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-[11px] text-white/30 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
