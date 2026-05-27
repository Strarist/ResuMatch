'use client';

import { motion } from 'framer-motion';
import Reveal from './Reveal';

const systems = [
  { category: 'Parsing & Extraction', items: ['PDF Sanitizer', 'NLP Entity Engine', 'Skill Taxonomy'] },
  { category: 'Intelligence Core', items: ['Embedding Model', 'Similarity Engine', 'Confidence Scorer'] },
  { category: 'Market Systems', items: ['Demand Tracker', 'Salary Benchmarks', 'Trend Analyzer'] },
  { category: 'Recruiter Layer', items: ['Signal Processor', 'Fit Scoring', 'Pipeline Ranker'] },
  { category: 'Career Engine', items: ['Trajectory Model', 'Gap Analyzer', 'Roadmap Generator'] },
  { category: 'Infrastructure', items: ['Queue Orchestrator', 'Cache Layer', 'Auth System'] },
];

export default function IntelligenceEngine() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="mb-12">
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Operating System depth</p>
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em]">Inside the intelligence engine</h2>
          <p className="mt-3 text-[14px] text-white/30 leading-relaxed max-w-lg">
            19 interconnected systems working in concert. Not a wrapper — a purpose-built career execution runtime.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {systems.map((group, i) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover p-4 rounded-xl border border-white/[0.05] bg-white/[0.015]"
            >
              <p className="text-[11px] font-medium text-white/50 mb-3">{group.category}</p>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-400/40" />
                    <span className="text-[12px] text-white/35">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-[11px] text-white/15 mt-8"
        >
          Distributed architecture · Sub-2s response time · 99.6% availability
        </motion.p>
      </div>
    </section>
  );
}
