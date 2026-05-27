'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { Target, Users, Zap, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const metrics = [
  {
    icon: Target,
    label: 'Match Accuracy',
    value: 94,
    suffix: '%',
    trend: 'up' as const,
    delta: '+3.2%',
    period: 'vs last month',
    spark: [62, 68, 71, 74, 79, 82, 86, 89, 91, 94],
  },
  {
    icon: Users,
    label: 'Recruiter Score',
    value: 8.7,
    suffix: '/10',
    decimals: 1,
    trend: 'up' as const,
    delta: '+0.4',
    period: 'top 12% of candidates',
    spark: [6.8, 7.0, 7.2, 7.5, 7.8, 8.0, 8.2, 8.4, 8.5, 8.7],
  },
  {
    icon: Zap,
    label: 'Processing Time',
    value: 1.8,
    suffix: 's',
    decimals: 1,
    trend: 'down' as const,
    delta: '-60%',
    period: 'from 4.5s baseline',
    spark: [4.5, 4.2, 3.8, 3.4, 3.0, 2.7, 2.4, 2.1, 1.9, 1.8],
  },
  {
    icon: TrendingUp,
    label: 'Career Velocity',
    value: 78,
    suffix: '%',
    trend: 'up' as const,
    delta: '+12%',
    period: 'quarter over quarter',
    spark: [42, 48, 52, 56, 60, 64, 68, 72, 75, 78],
  },
];

function MiniChart({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 70 - 15}`).join(' ');
  const color = positive ? '#10b981' : '#3b82f6';

  return (
    <svg viewBox="0 0 100 100" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

export default function MetricsV2Section() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="py-24 px-4 sm:px-6" ref={ref}>
      <div className="max-w-[1120px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3">Performance</p>
          <h2 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-white tracking-[-0.02em]">Real-time intelligence metrics</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="card-hover group p-4 rounded-xl border border-white/[0.06] bg-white/[0.015] hover:border-white/[0.1]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <m.icon size={13} className="text-white/30" />
                  <span className="text-[11px] font-medium text-white/45">{m.label}</span>
                </div>
                <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                  m.trend === 'up' ? 'text-emerald-400/80' : 'text-blue-400/80'
                }`}>
                  {m.trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {m.delta}
                </div>
              </div>

              {/* Value */}
              <div className="mb-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {inView && (
                    <CountUp
                      end={m.value}
                      duration={1.8}
                      delay={i * 0.1}
                      suffix={m.suffix}
                      decimals={m.decimals || 0}
                    />
                  )}
                </span>
              </div>

              {/* Chart */}
              <div className="mb-2">
                <MiniChart data={m.spark} positive={m.trend === 'up'} />
              </div>

              {/* Period */}
              <p className="text-[10px] text-white/20">{m.period}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
