'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import Reveal from './Reveal';

const faqs = [
  {
    question: 'How is my resume stored and secured?',
    answer: 'All uploaded resume files are subjected to deep sanitization protocols that strip tracking scripts and structural metadata for complete confidentiality. Resumes are stored within encrypted cloud object volumes and are never shared with external aggregators or unverified third parties.',
  },
  {
    question: 'Can I delete my data completely?',
    answer: 'Absolutely. Deleting a resume immediately and permanently removes its physical PDF file from our secure object store. You can also reset or recalibrate your Career Identity Hub at any time directly through your profile settings with a single click.',
  },
  {
    question: 'How accurate are recommendations and match scores?',
    answer: 'Our match calculations utilize advanced multi-dimensional semantic mapping (experience weight, technical project depth, academic alignment, and validated skill matrices) rather than basic keyword comparisons. This ensures a high level of relevance, verified against continuous real-time market telemetry.',
  },
  {
    question: 'What file formats are supported?',
    answer: 'We focus exclusively on the PDF file format (.pdf) up to a maximum size of 10MB. PDF provides the most reliable layout structure for our sanitization and parsing engine, ensuring your text extraction and skill vectors are perfectly precise.',
  },
  {
    question: 'What is the Career Identity Hub?',
    answer: 'The Career Identity Hub is your persistent strategic profile. Unlike other platforms where deleting a resume wipes your entire history, Skillyn maintains your verified skills and calibrated targets inside the Career Identity Hub as your source of truth, enabling you to build upon your progress over time.',
  },
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="about" className="py-24 px-4 sm:px-6 relative overflow-hidden bg-slate-950/40">
      {/* Background gradients */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[760px] mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[12px] font-semibold text-emerald-400 uppercase tracking-wider mb-3">Frequently Asked Questions</p>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white tracking-tight leading-tight">
            Clear answers about your career privacy.
          </h2>
          <p className="mt-3 text-[15px] text-white/50 leading-relaxed max-w-md mx-auto">
            Everything you need to know about our validation pipeline, secure storage, and data ownership.
          </p>
        </Reveal>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="rounded-xl border border-white/[0.05] bg-[#020617]/35 hover:bg-[#020617]/50 transition-colors duration-200 overflow-hidden"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-[14px] font-bold text-white/95 flex items-center gap-3">
                    <HelpCircle size={15} className="text-emerald-400 flex-shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-white/30 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-1 text-[13px] text-white/50 leading-relaxed border-t border-white/[0.02]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
