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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] font-medium text-blue-400/80 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
              Career Operating System
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(3rem,5vw,5.4rem)] font-semibold tracking-[-0.02em] leading-[1.05] text-white max-w-[640px]"
          >
            The autonomous{' '}
            <span className="text-white/40">career operating system.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[15px] text-white/40 leading-[1.75] max-w-[440px]"
          >
            Orchestrating skill intelligence, live recruiter signals, and market demand vectors into a self-compounding career runtime.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]"
          >
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b101b] border border-blue-500/20 text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              ORCHESTRATOR: ACTIVE
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b101b] border border-emerald-500/20 text-emerald-300">
              RECRUITER ALIGNMENT: 94.0%
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b101b] border border-white/[0.06] text-white/55">
              VELOCITY VECTOR: +12% QOQ
            </span>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-3 pt-2">
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            >
              Initialize Infrastructure <ArrowRight size={14} />
            </Link>
            <Link
              href="#features"
              className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white/40 border border-white/[0.08] rounded-lg hover:text-white/60 hover:border-white/[0.12]"
            >
              View Architecture
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-8 pt-6"
          >
            {[
              { value: '94%', label: 'Match accuracy' },
              { value: '<2s', label: 'Analysis time' },
              { value: '10k+', label: 'Skills mapped' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[14px] font-semibold text-white/80 tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard with depth offset */}
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
