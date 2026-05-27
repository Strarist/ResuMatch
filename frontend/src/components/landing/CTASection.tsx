'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { fadeUp, staggerContainer } from '@/lib/motion';

export default function CTASection() {
  return (
    <section className="py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-12 sm:p-16 text-center overflow-hidden"
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/[0.05] via-transparent to-violet-500/[0.05]" />
          <motion.div
            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ background: 'conic-gradient(from 0deg, transparent, rgba(59,130,246,0.06), transparent, rgba(139,92,246,0.06), transparent)' }}
          />

          <div className="relative">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-blue-300 border border-blue-400/20 bg-blue-500/[0.06] mb-6">
              <Sparkles size={12} />
              Start today — free tier available
            </motion.div>

            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Turn Your Career Into a<br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Compounding Asset
              </span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-white/40 max-w-lg mx-auto mb-8">
              Join thousands of professionals using AI-powered intelligence to make strategic career decisions with confidence.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl hover:from-blue-400 hover:to-violet-400 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Start Building
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-white/70 border border-white/[0.1] rounded-xl hover:bg-white/[0.04] hover:text-white transition-all duration-300"
              >
                Explore Intelligence
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
