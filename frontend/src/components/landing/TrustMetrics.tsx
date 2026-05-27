'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

const stats = [
  { value: 47200, suffix: '', label: 'Resumes analyzed', format: '47.2k' },
  { value: 2.1, suffix: 'M', label: 'Skills mapped', decimals: 1 },
  { value: 184000, suffix: '', label: 'Opportunity matches', format: '184k' },
  { value: 12400, suffix: '', label: 'Recruiter signals', format: '12.4k' },
  { value: 99.6, suffix: '%', label: 'Availability', decimals: 1 },
];

export default function TrustMetrics() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 5000);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section className="py-14 px-4 sm:px-6 border-y border-white/[0.03]" ref={ref}>
      <div className="max-w-[1120px] mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6 sm:gap-x-14">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="text-center"
            >
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums">
                {inView && (
                  s.format ? <span>{s.format}</span> : <CountUp end={s.value} duration={1.6} delay={i * 0.08} suffix={s.suffix} decimals={s.decimals || 0} />
                )}
              </p>
              <p className="text-[10px] text-white/25 mt-1">{s.label}</p>
            </motion.div>
          ))}

          {/* Live operational indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-center"
          >
            <p className="text-lg sm:text-xl font-bold text-emerald-400/70 tracking-tight tabular-nums">
              {elapsed > 0 ? `${elapsed * 5}s` : '0s'}
            </p>
            <p className="text-[10px] text-white/25 mt-1">Since last refresh</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
