import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
  className?: string;
}

export default function StatCard({ icon, label, value, loading = false, className = '' }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 shadow-xl backdrop-blur-md flex flex-col items-start gap-2 transition-all ${className}`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        {loading ? <span className="animate-pulse">...</span> : value}
      </div>
    </motion.div>
  );
} 