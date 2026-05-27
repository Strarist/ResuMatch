'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Brain, TrendingUp } from 'lucide-react';
import { fadeUp, staggerContainer } from '@/lib/motion';
import DashboardV3 from './DashboardV3';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* LEFT SIDE */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
          {/* Eyebrow Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-blue-300 border border-blue-400/20 bg-blue-500/[0.06] backdrop-blur-sm shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <Sparkles size={14} className="text-blue-400" />
              AI-Powered Career Intelligence
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              AI-Powered
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Career Operating
            </span>
            <br />
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              System
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-lg leading-relaxed">
            Transform your job search with semantic skill matching, recruiter intelligence, and real-time market analysis — all powered by advanced AI.
          </motion.p>

          {/* CTA Group */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl hover:from-blue-400 hover:to-violet-400 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Start Building Your Career Graph
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-white/70 border border-white/[0.1] rounded-xl hover:bg-white/[0.04] hover:text-white hover:border-white/[0.2] transition-all duration-300"
            >
              Explore Platform
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-6 pt-4">
            {[
              { icon: Shield, label: 'Secure Resume Parsing' },
              { icon: Brain, label: 'Recruiter Intelligence' },
              { icon: TrendingUp, label: 'Real-Time Market Insights' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2 text-xs text-white/40"
              >
                <item.icon size={14} className="text-blue-400/60" />
                {item.label}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE */}
        <DashboardV3 />
      </div>
    </section>
  );
}
