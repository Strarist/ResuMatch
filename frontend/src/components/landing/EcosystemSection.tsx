'use client';

import { motion } from 'framer-motion';
import { FileText, Brain, BarChart3, UserCheck, Radar, Rocket, ChevronRight } from 'lucide-react';
import Reveal from './Reveal';

const layers = [
  {
    icon: FileText,
    label: 'Resume Parsing',
    detail: 'PDF extraction, NLP entity recognition, structured skill mapping',
    color: '#3b82f6',
  },
  {
    icon: Brain,
    label: 'Intelligence Layer',
    detail: 'Sentence embeddings, semantic similarity, confidence scoring',
    color: '#8b5cf6',
  },
  {
    icon: BarChart3,
    label: 'Market Analysis',
    detail: 'Demand signals, salary benchmarks, growth trajectories',
    color: '#06b6d4',
  },
  {
    icon: UserCheck,
    label: 'Recruiter Signals',
    detail: 'Hiring patterns, role fit scoring, interview readiness',
    color: '#10b981',
  },
  {
    icon: Radar,
    label: 'Opportunity Engine',
    detail: 'Role matching, pipeline ranking, application timing',
    color: '#f59e0b',
  },
  {
    icon: Rocket,
    label: 'Career Evolution',
    detail: 'Trajectory projection, gap analysis, growth roadmap',
    color: '#ef4444',
  },
];

export default function EcosystemSection() {
  return (
    <section id="intelligence" className="py-24 px-4 sm:px-6">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="mb-12">
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">System architecture</p>
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em]">Six layers of compounding career execution signal</h2>
          <p className="mt-3 text-[14px] text-white/30 leading-relaxed max-w-lg">
            Each layer processes and enriches telemetry for the next — building a continuously adaptive computational model of your career state.
          </p>
        </Reveal>

        {/* Flow diagram */}
        <div className="space-y-2">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              <div className="card-hover flex items-center gap-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] hover:bg-white/[0.025]">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.06]" style={{ backgroundColor: `${layer.color}08` }}>
                  <layer.icon size={15} style={{ color: layer.color }} className="opacity-70" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-white/15">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="text-[13px] font-semibold text-white/75">{layer.label}</h3>
                  </div>
                  <p className="text-[11px] text-white/30 mt-0.5">{layer.detail}</p>
                </div>

                {/* Arrow connector */}
                {i < layers.length - 1 && (
                  <ChevronRight size={14} className="text-white/10 flex-shrink-0" />
                )}
              </div>

              {/* Vertical connector */}
              {i < layers.length - 1 && (
                <div className="ml-[1.75rem] h-2 w-px bg-gradient-to-b from-white/[0.06] to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-8 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center"
        >
          <p className="text-[12px] text-white/40">
            <span className="text-white/60 font-medium">Result:</span>{' '}
            A continuously adaptive operating system that compounds career state advantage with every telemetry sync.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
