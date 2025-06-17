import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const GlassCard = ({ children, className = '', onClick, hover = true }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
      className={`
        relative overflow-hidden rounded-xl
        bg-white/10 dark:bg-gray-900/10
        backdrop-blur-md
        border border-white/20 dark:border-gray-700/20
        shadow-lg
        transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:border-white/30 dark:hover:border-gray-600/30' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-gray-800/10" />
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  );
};

// Example usage:
// <GlassCard className="w-full max-w-md">
//   <h2 className="text-xl font-semibold">Card Title</h2>
//   <p className="mt-2 text-gray-600 dark:text-gray-300">Card content goes here</p>
// </GlassCard> 