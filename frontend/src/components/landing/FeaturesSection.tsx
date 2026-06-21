'use client';

import { motion } from 'framer-motion';
import { Brain, Compass, Target, Shield, MessageSquare, RefreshCw } from 'lucide-react';
import Reveal from './Reveal';

const features = [
  { icon: Brain, title: 'AI Resume Parsing', description: 'Deep parsing maps your structural stack competencies, experiences, and education in seconds.' },
  { icon: Compass, title: 'Career Roadmaps', description: 'Get a personalized learning path with actionable milestones to systematically bridge core skill gaps.' },
  { icon: Target, title: 'Opportunities Match', description: 'Real-time jobs matched and ranked using compatibility scorecards based on your active skills.' },
  { icon: Shield, title: 'Secure Sanitization', description: 'Deep file sanitization strips tracking metadata and scripts from uploaded resume assets for absolute privacy.' },
  { icon: MessageSquare, title: 'Personalized AI Coach', description: 'A strategic technical mentor grounded specifically on your profile, gaps, and target matching jobs.' },
  { icon: RefreshCw, title: 'Continuous Calibration', description: 'Recalibrate your career goals, matching milestones, and opportunities instantly with a single click.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6">
      <div className="max-w-[1120px] mx-auto">
        <Reveal className="mb-12">
          <p className="text-[12px] font-semibold text-emerald-400 uppercase tracking-wider mb-3">Product Features</p>
          <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white tracking-tight leading-tight">Everything you need to accelerate your career.</h2>
          <p className="mt-3 text-[15px] text-white/50 leading-relaxed max-w-md">
            Six cohesive layers working together to keep your profile, skills, roadmaps, and opportunities in perfect alignment.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover p-6 rounded-xl border border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1] flex flex-col justify-between"
            >
              <div>
                <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg w-fit mb-4">
                  <f.icon size={18} className="text-emerald-400" />
                </div>
                <h3 className="text-[15px] font-bold text-white/80 mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
