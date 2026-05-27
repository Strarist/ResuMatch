'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTAv2Section() {
  return (
    <section className="py-28 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[580px] mx-auto text-center"
      >
        <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em] mb-4">
          Your career deserves an operating system.
        </h2>
        <p className="text-[14px] text-white/30 leading-relaxed max-w-md mx-auto mb-8">
          Join thousands of professionals using intelligence infrastructure to make strategic career decisions.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/signup" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-400">
            Start Free <ArrowRight size={14} />
          </Link>
          <Link href="#features" className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium text-white/40 border border-white/[0.08] rounded-lg hover:text-white/60 hover:border-white/[0.12]">
            Explore platform
          </Link>
        </div>
        <p className="mt-5 text-[11px] text-white/15">No credit card required · Free tier available</p>
      </motion.div>
    </section>
  );
}
