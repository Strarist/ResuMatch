'use client';

import { motion } from 'framer-motion';

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Layer 1: Dark base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]" />

      {/* Layer 2: Radial glow blobs */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/8 blur-[120px]"
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/8 blur-[120px]"
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-cyan-500/5 blur-[100px]"
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />

      {/* Layer 3: Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* Layer 4: Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}
