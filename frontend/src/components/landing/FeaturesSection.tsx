'use client';

import { motion } from 'framer-motion';
import { Brain, BarChart3, Zap, Shield, Target, Layers } from 'lucide-react';
import Reveal from './Reveal';

const features = [
  { icon: Brain, title: 'Semantic Matching', description: 'Deep sentence embeddings map skill relationships beyond surface-level keyword matching.' },
  { icon: BarChart3, title: 'Execution Analytics', description: 'Skill radars, match confidence, and career velocity state tracking in one unified interface.' },
  { icon: Zap, title: 'Real-time Orchestration', description: 'Telemetry synchronization, analysis, and execution pipeline changes compiled in sub-2 seconds.' },
  { icon: Shield, title: 'Enterprise Security', description: 'Deep PDF sanitization, encrypted pipelines, and SOC 2-aligned data isolation.' },
  { icon: Target, title: 'Multi-factor Scoring', description: 'Weighted confidence scoring across skills, credentials, market demand, and trajectory.' },
  { icon: Layers, title: 'Career Graph', description: 'A living computational topology mapping your skills, gaps, market position, and growth vectors.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="mb-12">
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Orchestration Architecture</p>
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em]">Engineered for autonomous career orchestration</h2>
          <p className="mt-3 text-[14px] text-white/30 leading-relaxed max-w-md">
            Six interconnected execution layers synthesizing talent vectors, recruiter pipelines, and market indicators.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover p-5 rounded-xl border border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1]"
            >
              <f.icon size={15} className="text-white/30 mb-3" />
              <h3 className="text-[13px] font-semibold text-white/75 mb-1.5">{f.title}</h3>
              <p className="text-[12px] text-white/30 leading-[1.6]">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
