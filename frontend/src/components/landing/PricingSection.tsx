'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Flame } from 'lucide-react';
import Link from 'next/link';
import Reveal from './Reveal';

const tiers = [
  {
    name: 'Free Career Tier',
    price: '$0',
    frequency: 'forever',
    desc: 'Core resume parsing and skill identification for individual professionals.',
    features: [
      '1 Active Resume Upload',
      'Basic Skill Ingestion & Profiling',
      'Unified Career Identity Hub',
      'Core Milestone Roadmap Generation',
      'Standard Match Scorecard previews',
    ],
    buttonText: 'Start Free Tracking',
    buttonHref: '/signup',
    popular: false,
  },
  {
    name: 'Strategic Pro Tier',
    price: '$19',
    frequency: 'month',
    desc: 'Continuous calibration, interactive AI coaching, and deep market alignment.',
    features: [
      'Unlimited Resume Uploads & Replaces',
      'Interactive AI Coach groundings',
      'Full Competitiveness & Readiness scorecards',
      'Active Recruiter Signal telemetry',
      'Priority Opportunity matching indices',
      'Real-time Market snapshot calibrations',
    ],
    buttonText: 'Unlock Strategic Pro',
    buttonHref: '/signup',
    popular: true,
  },
  {
    name: 'Recruiter Hub',
    price: 'Custom',
    frequency: 'volume',
    desc: 'Structured API access and batch candidate compatibility scoring for talent acquisition.',
    features: [
      'High-throughput Candidate Ingestion',
      'Batch Match Compatibility Scoring',
      'Custom Skill Taxonomy matching',
      'Dedicated API endpoint keys',
      'Premium Technical depth vetting',
      'SLA Integration support',
    ],
    buttonText: 'Contact Hiring Sales',
    buttonHref: '/signup',
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 relative overflow-hidden bg-slate-950/20">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1120px] mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[12px] font-semibold text-emerald-400 uppercase tracking-wider mb-3">Pricing Models</p>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white tracking-tight leading-tight">
            Transparent plans for continuous growth.
          </h2>
          <p className="mt-3 text-[15px] text-white/50 leading-relaxed max-w-md mx-auto">
            Choose the clear path to upskilling and career opportunities with no hidden fees.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`p-8 rounded-2xl border flex flex-col justify-between relative transition-all duration-300 ${
                t.popular
                  ? 'border-emerald-500/30 bg-emerald-500/[0.02] shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/20'
                  : 'border-white/[0.05] bg-white/[0.01] hover:border-white/[0.08]'
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-emerald-500 text-black text-[10px] font-bold tracking-wider uppercase rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20">
                  <Flame size={10} className="fill-black" />
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-[15px] font-bold text-white mb-2">{t.name}</h3>
                  <p className="text-[12px] text-white/40 leading-relaxed min-h-[40px]">{t.desc}</p>
                </div>

                <div className="flex items-baseline gap-1.5 mb-8">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{t.price}</span>
                  {t.frequency !== 'volume' && (
                    <span className="text-[12px] text-white/30">/{t.frequency}</span>
                  )}
                </div>

                <div className="border-t border-white/[0.06] pt-6 mb-8 space-y-3.5">
                  {t.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={10} className="text-emerald-400" />
                      </div>
                      <span className="text-[12px] text-white/60 leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={t.buttonHref}
                className={`w-full py-3 rounded-lg text-[13px] font-bold text-center transition-all duration-200 block ${
                  t.popular
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-lg shadow-emerald-500/15'
                    : 'bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] text-white'
                }`}
              >
                {t.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
