'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, ShieldAlert, Zap, Compass, Briefcase, FileText } from 'lucide-react';
import Reveal from './Reveal';

const problems = [
  {
    icon: ShieldAlert,
    title: 'Resume Mismatch',
    desc: 'Sending 100+ generic applications into candidate tracking software with zero human replies or visibility.',
  },
  {
    icon: AlertCircle,
    title: 'Hidden Skill Gaps',
    desc: 'Vague career guidance leaves you guessing which exact framework updates or specializations hiring managers want today.',
  },
  {
    icon: Zap,
    title: 'Career Uncertainty',
    desc: 'Fluctuating market demands make it difficult to prove your competitive edge or command top-tier compensation.',
  },
];

const pipelineSteps = [
  { label: 'Resume', icon: FileText, desc: 'Secure upload & extraction' },
  { label: 'AI Analysis', icon: Zap, desc: 'Deep taxonomy parsing' },
  { label: 'Career Profile', icon: Compass, desc: 'Strategic profile hub' },
  { label: 'Roadmap', icon: Compass, desc: 'Targeted skill milestones' },
  { label: 'Opportunities', icon: Briefcase, desc: 'Verifiable match score' },
];

export default function ProblemSolutionSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden bg-slate-950/40">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1120px] mx-auto space-y-32">
        {/* PART 1: The Problem */}
        <div>
          <Reveal className="text-center mb-16">
            <p className="text-[12px] font-semibold text-rose-400 uppercase tracking-wider mb-3">The Old Way</p>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white tracking-tight leading-tight">
              Why traditional career tracking is fundamentally broken.
            </h2>
            <p className="mt-3 text-[15px] text-white/50 leading-relaxed max-w-md mx-auto">
              Static documents and generic job boards fail to highlight your active technical potential.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative group"
              >
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg w-fit mb-5">
                  <p.icon size={20} className="text-rose-400" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">{p.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* PART 2: The Solution Pipeline */}
        <div>
          <Reveal className="text-center mb-16">
            <p className="text-[12px] font-semibold text-emerald-400 uppercase tracking-wider mb-3">The Skillyn Pipeline</p>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white tracking-tight leading-tight">
              From static document to actionable career engine.
            </h2>
            <p className="mt-3 text-[15px] text-white/50 leading-relaxed max-w-md mx-auto">
              We turn your resume into a live, continuous cycle of growth, skill mapping, and genuine market opportunities.
            </p>
          </Reveal>

          {/* Desktop visual pipeline */}
          <div className="hidden lg:flex items-center justify-between p-8 rounded-2xl border border-white/[0.05] bg-[#020617]/40 backdrop-blur-xl relative">
            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={step.label}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="flex flex-col items-center text-center w-40 group"
                >
                  <div className="w-14 h-14 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center mb-4 group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10 transition-all duration-300">
                    <step.icon size={22} className="text-emerald-400" />
                  </div>
                  <h4 className="text-[14px] font-bold text-white mb-1">{step.label}</h4>
                  <p className="text-[11px] text-white/40">{step.desc}</p>
                </motion.div>

                {idx < pipelineSteps.length - 1 && (
                  <div className="flex-1 flex justify-center text-white/10">
                    <ArrowRight size={20} className="animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile visual pipeline */}
          <div className="lg:hidden space-y-4">
            {pipelineSteps.map((step, idx) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.05] bg-[#020617]/30"
              >
                <div className="w-10 h-10 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center flex-shrink-0">
                  <step.icon size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white">{step.label}</h4>
                  <p className="text-[11px] text-white/40">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
