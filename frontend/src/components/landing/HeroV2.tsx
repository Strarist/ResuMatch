'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DashboardV4 from './DashboardV4';
import { Layout } from '@/components/layout/LayoutSystem';

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } };

export default function HeroV2() {
  return (
    <section className="relative flex items-center min-h-[92vh] pt-10 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Atmospheric gradient - subtle depth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/[0.02] rounded-full blur-[140px]" />
      </div>

      <Layout variant="ultra" className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(520px,0.85fr)] gap-8 lg:gap-12 items-center relative z-10 pt-10">
        {/* Content */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[12px] font-semibold text-emerald-400 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SaaS Career Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.75rem,4.5vw,4.75rem)] font-bold tracking-tight leading-[1.1] text-white max-w-[640px]"
          >
            Build your personalized{' '}
            <span className="text-emerald-400">tech career path.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[17px] text-white/50 leading-relaxed max-w-[480px]"
          >
            Upload your resume to instantly extract tech stacks, map milestones to bridge your core skill gaps, and match with top opportunities via fit scorecards.
          </motion.p>

          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-4 pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
            >
              Get Started <ArrowRight size={16} />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-[15px] font-bold text-white/60 border border-white/[0.08] rounded-lg hover:text-white hover:border-white/[0.16] transition-all duration-200"
            >
              Learn More
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-10 pt-8 border-t border-white/[0.04] max-w-[480px]"
          >
            {[
              { value: '95%', label: 'Match accuracy' },
              { value: '<5s', label: 'Resume extraction' },
              { value: '10k+', label: 'Engineers matched' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[18px] font-bold text-white/90 tabular-nums">{stat.value}</p>
                <p className="text-[12px] text-white/30 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview Card Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block w-full -ml-4"
        >
          <DashboardV4 />
        </motion.div>
      </Layout>
    </section>
  );
}
