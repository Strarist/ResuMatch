'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

/**
 * Motion System — ResuMatch
 *
 * Timing philosophy:
 * - Micro (hover, press): 120-150ms
 * - Standard (panels, reveals): 200-300ms
 * - Emphasis (drawers, modals): 300-400ms
 * - Streaming: continuous (no fixed duration)
 *
 * Easing:
 * - exit: ease-in (accelerate out)
 * - enter: [0.16, 1, 0.3, 1] (expo deceleration — premium feel)
 * - spring: { stiffness: 400, damping: 30 } (snappy, no bounce)
 */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// === Reusable Variants ===

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

export const slideFromRight: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: EASE_OUT_EXPO } },
  exit: { x: '100%', transition: { duration: 0.2, ease: 'easeIn' } },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// === Motion Components ===

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fade in with subtle upward movement. Use for content reveals. */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
}

/** Stagger children with 50ms delay between each. Use for lists/grids. */
export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger item. Must be a child of StaggerList. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={slideUp} className={className}>
      {children}
    </motion.div>
  );
}

interface PresenceProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

/** Animate mount/unmount. Use for conditional content. */
export function Presence({ children, show, className }: PresenceProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="presence"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={scaleIn}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface NumberTickerProps {
  value: number;
  className?: string;
}

/** Animated number that interpolates to target value. Use for scores. */
export function NumberTicker({ value, className }: NumberTickerProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {Math.round(value)}
    </motion.span>
  );
}

// === Reduced Motion Support ===

/**
 * CSS utility classes for reduced motion:
 *
 * In globals.css or Tailwind:
 * @media (prefers-reduced-motion: reduce) {
 *   *, *::before, *::after {
 *     animation-duration: 0.01ms !important;
 *     animation-iteration-count: 1 !important;
 *     transition-duration: 0.01ms !important;
 *   }
 * }
 *
 * Framer Motion respects this automatically via its `useReducedMotion` hook.
 */
