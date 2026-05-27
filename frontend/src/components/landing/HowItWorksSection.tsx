'use client';

import { motion } from 'framer-motion';
import { Upload, Brain, BarChart3, Rocket } from 'lucide-react';
import Reveal from './Reveal';

const steps = [
  { icon: Upload, title: 'Upload', description: 'Drop your PDF resume. Parsed and secured in seconds.' },
  { icon: Brain, title: 'Analyze', description: 'AI maps your skills against job requirements with semantic understanding.' },
  { icon: BarChart3, title: 'Score', description: 'Multi-dimensional scoring with confidence metrics across all factors.' },
  { icon: Rocket, title: 'Act', description: 'Get recommendations, close gaps, and track your trajectory.' },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6">
      <div className="max-w-[720px] mx-auto">
        <Reveal className="text-center mb-10">
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">Process</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Four steps to clarity</h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="flex gap-3.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.015]"
            >
              <div className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center flex-shrink-0">
                <step.icon size={15} className="text-white/30" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono text-white/15">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="text-[13px] font-semibold text-white/70">{step.title}</h3>
                </div>
                <p className="text-[12px] text-white/30 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
