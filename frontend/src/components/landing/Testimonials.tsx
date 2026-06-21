'use client';

import { motion } from 'framer-motion';
import Reveal from './Reveal';

const testimonials = [
  {
    quote: 'The signal quality is unlike anything else. I can see execution patterns, not just listed skills. It cuts my screening time by 70%.',
    name: 'Sarah Chen',
    role: 'Senior Technical Recruiter',
    company: 'Series B AI Startup',
  },
  {
    quote: 'Skillyn candidates come with context — trajectory, market fit, growth velocity. I stopped guessing and started hiring with confidence.',
    name: 'Marcus Webb',
    role: 'Engineering Hiring Lead',
    company: 'Enterprise SaaS',
  },
  {
    quote: 'The recruiter intelligence layer surfaces candidates I would have missed. It understands role fit at a level keyword tools never could.',
    name: 'Priya Sharma',
    role: 'Head of Talent',
    company: 'Developer Platform',
  },
];

export default function Testimonials() {
  return (
    <section id="recruiters" className="py-24 px-4 sm:px-6">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="mb-12">
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Trusted by recruiters</p>
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em]">Hiring teams see the difference</h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover p-5 rounded-xl border border-white/[0.05] bg-white/[0.015]"
            >
              <p className="text-[13px] text-white/45 leading-[1.7] mb-5">&ldquo;{t.quote}&rdquo;</p>
              <footer>
                <p className="text-[12px] font-medium text-white/65">{t.name}</p>
                <p className="text-[11px] text-white/20 mt-0.5">{t.role} · {t.company}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
