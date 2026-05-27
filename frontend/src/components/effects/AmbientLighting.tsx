'use client';

import { motion } from 'framer-motion';

export default function AmbientLighting() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

      {/* Atmospheric radial lighting */}
      <motion.div
        className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[80vw] h-[40vh] rounded-full bg-blue-500/[0.02] blur-[120px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Soft reflective overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-white/[0.008] to-transparent" />

      {/* Ambient cinematic shadow at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
