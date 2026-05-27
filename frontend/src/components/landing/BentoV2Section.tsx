'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, Compass, UserCheck, Map, Radar, CheckCircle, Cpu } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion';
import Reveal from '../landing/Reveal';

const bentoItems = [
  { icon: FileText, title: 'Resume Intelligence', description: 'Deep semantic parsing with skill extraction and confidence scoring', span: 'md:col-span-2 md:row-span-2', metric: '94%', metricLabel: 'accuracy', spark: [60, 70, 75, 82, 88, 91, 94] },
  { icon: TrendingUp, title: 'Market Intelligence', description: 'Real-time salary data and demand signals', span: '', metric: '2.4k', metricLabel: 'signals', spark: [30, 45, 55, 60, 72, 80, 90] },
  { icon: Compass, title: 'Career Trajectory', description: 'AI-projected growth paths', span: '', metric: '5yr', metricLabel: 'forecast', spark: [20, 30, 45, 55, 65, 78, 88] },
  { icon: UserCheck, title: 'Recruiter Intelligence', description: 'Understand what recruiters prioritize for your target roles', span: 'md:col-span-2', metric: '89%', metricLabel: 'match', spark: [50, 58, 65, 72, 78, 84, 89] },
  { icon: Map, title: 'Strategic Planning', description: 'Gap analysis and upskilling roadmaps', span: '', metric: '12', metricLabel: 'paths', spark: [2, 4, 5, 7, 9, 10, 12] },
  { icon: Radar, title: 'Opportunity Radar', description: 'Continuous role scanning', span: '', metric: 'Live', metricLabel: 'status', spark: [40, 50, 45, 60, 55, 70, 65] },
  { icon: CheckCircle, title: 'Execution Tracking', description: 'Applications, interviews, outcomes', span: '', metric: '3x', metricLabel: 'velocity', spark: [10, 15, 20, 30, 45, 60, 80] },
  { icon: Cpu, title: 'AI Workspace', description: 'Cover letters, prep, strategy on demand', span: 'md:col-span-2', metric: '<2s', metricLabel: 'generation', spark: [90, 88, 85, 82, 80, 78, 75] },
];

function MicroChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[2px] h-5">
      {data.map((v, i) => (
        <div key={i} className="w-[3px] rounded-full bg-gradient-to-t from-blue-400/40 to-blue-400/10" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

export default function BentoV2Section() {
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
          {bentoItems.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.3 } }}
              className={`group relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500 overflow-hidden ${item.span}`}
            >
              {/* Spotlight sweep on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)]" />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-violet-500/15 border border-white/[0.06] flex items-center justify-center group-hover:scale-110 group-hover:border-blue-400/20 transition-all duration-300">
                    <item.icon size={14} className="text-blue-400/80" />
                  </div>
                  <div className="flex items-center gap-2">
                    <MicroChart data={item.spark} />
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block leading-none">{item.metric}</span>
                      <span className="text-[8px] text-white/25">{item.metricLabel}</span>
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-[11px] text-white/35 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
