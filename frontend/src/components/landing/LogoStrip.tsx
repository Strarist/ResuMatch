'use client';

import { motion } from 'framer-motion';

const companies = [
  'Vercel', 'Linear', 'Notion', 'Figma', 'Stripe', 'Datadog', 'Supabase', 'Railway',
];

export default function LogoStrip() {
  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-[1120px] mx-auto">
        <p className="text-[10px] text-white/20 uppercase tracking-wider text-center mb-6">
          Built for teams at
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 sm:gap-x-12"
        >
          {companies.map((name) => (
            <span
              key={name}
              className="text-[13px] font-medium text-white/[0.12] tracking-wide select-none"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
