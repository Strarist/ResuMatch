'use client';

import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
}

export default function InteractiveCard({ children, className = '' }: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 200, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 30 });

  const handleMouse = (e: MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x);
    mouseY.set(y);
    rotateX.set(((y - rect.height / 2) / rect.height) * -4);
    rotateY.set(((x - rect.width / 2) / rect.width) * 4);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const glowBackground = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.09) 0%, rgba(139, 92, 246, 0.04) 45%, transparent 70%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`relative group rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] ${className}`}
    >
      {/* Spotlight glow following cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: glowBackground,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
