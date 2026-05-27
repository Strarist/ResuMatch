import type { Transition } from 'framer-motion';

const ease = [0.16, 1, 0.3, 1] as const;

export const timing = {
  ultraFast: { duration: 0.15, ease } satisfies Transition,
  fast: { duration: 0.3, ease } satisfies Transition,
  smooth: { duration: 0.5, ease } satisfies Transition,
  cinematic: { duration: 0.8, ease } satisfies Transition,
  floating: { duration: 4, ease: 'easeInOut', repeat: Infinity } satisfies Transition,
  dramaticReveal: { duration: 1, ease, delay: 0.2 } satisfies Transition,
} as const;

export const spring = {
  snappy: { type: 'spring', stiffness: 300, damping: 30 } satisfies Transition,
  gentle: { type: 'spring', stiffness: 150, damping: 25 } satisfies Transition,
  heavy: { type: 'spring', stiffness: 100, damping: 20 } satisfies Transition,
} as const;
