'use client';

import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import Reveal from './Reveal';

const capabilities = [
  { feature: 'Semantic skill understanding', traditional: false, skillyn: true },
  { feature: 'Recruiter confidence scoring', traditional: false, skillyn: true },
  { feature: 'Market demand adaptation', traditional: false, skillyn: true },
  { feature: 'Career trajectory modeling', traditional: false, skillyn: true },
  { feature: 'Execution pattern analysis', traditional: false, skillyn: true },
  { feature: 'Keyword extraction', traditional: true, skillyn: true },
  { feature: 'PDF parsing', traditional: true, skillyn: true },
  { feature: 'Opportunity ranking intelligence', traditional: false, skillyn: true },
];

export default function CapabilitiesMatrix() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-[720px] mx-auto">
        <Reveal className="mb-12">
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Comparison</p>
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em]">Beyond traditional resume tools</h2>
          <p className="mt-3 text-[14px] text-white/30 leading-relaxed max-w-md">
            Static parsers extract keywords. Skillyn orchestrates an autonomous career operating system.
          </p>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-white/[0.06] overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
            <span className="text-[11px] text-white/30 font-medium">Capability</span>
            <span className="text-[11px] text-white/30 font-medium text-center">Traditional</span>
            <span className="text-[11px] text-blue-400/70 font-medium text-center">Skillyn</span>
          </div>

          {/* Rows */}
          {capabilities.map((c, i) => (
            <div
              key={c.feature}
              className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] px-4 py-2.5 ${
                i < capabilities.length - 1 ? 'border-b border-white/[0.03]' : ''
              }`}
            >
              <span className="text-[12px] text-white/50">{c.feature}</span>
              <span className="flex justify-center">
                {c.traditional ? (
                  <Check size={13} className="text-white/20" />
                ) : (
                  <Minus size={13} className="text-white/10" />
                )}
              </span>
              <span className="flex justify-center">
                <Check size={13} className="text-blue-400/70" />
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
