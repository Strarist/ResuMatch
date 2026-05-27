'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { staggerContainer, fadeUp } from '@/lib/motion';

const metrics = [
  { value: 95, suffix: '%', label: 'Match Accuracy', description: 'Semantic precision' },
  { value: 2400, suffix: '+', label: 'Jobs Matched', description: 'This quarter' },
  { value: 1.8, suffix: 's', label: 'AI Analysis', description: 'Average response' },
  { value: 98, suffix: '%', label: 'Satisfaction', description: 'User rating' },
];

export default function MetricsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <section id="metrics" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              variants={fadeUp}
              className="relative group text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.06),transparent_70%)]" />
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {inView && (
                    <CountUp
                      end={metric.value}
                      duration={2}
                      delay={i * 0.15}
                      suffix={metric.suffix}
                      decimals={metric.value % 1 !== 0 ? 1 : 0}
                    />
                  )}
                </div>
                <p className="text-sm font-medium text-white/60">{metric.label}</p>
                <p className="text-xs text-white/30 mt-1">{metric.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
