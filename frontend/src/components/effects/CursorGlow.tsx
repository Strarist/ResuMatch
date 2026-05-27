'use client';

import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let lastTime = 0;
    const handleMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastTime < 16) return;
      lastTime = now;
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (glowRef.current) {
            glowRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
          }
          rafRef.current = 0;
        });
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 -z-5 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 will-change-transform"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
        zIndex: 1,
      }}
    />
  );
}
