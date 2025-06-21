import React from 'react';
import { motion } from 'framer-motion';

interface ScoreBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ 
  score, 
  size = 'md', 
  showTooltip = true,
  className = ''
}) => {
  // Determine color based on score
  const getColorClasses = () => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-200';
    if (score >= 60) return 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-amber-200';
    if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-orange-600 shadow-orange-200';
    return 'bg-gradient-to-r from-red-400 to-red-600 shadow-red-200';
  };

  // Get status text
  const getStatusText = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 text-xs',
    md: 'text-sm px-3 py-1.5 text-sm',
    lg: 'text-base px-4 py-2 text-base',
  };

  const tooltipContent = showTooltip 
    ? `Match Score: ${score}% - ${getStatusText()} match based on skill alignment and experience requirements`
    : '';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`group relative inline-flex items-center justify-center`}
    >
      <div
        className={`
          inline-flex items-center justify-center rounded-full 
          ${getColorClasses()} 
          text-white font-semibold ${sizeClasses[size]} 
          shadow-lg hover:shadow-xl transition-all duration-200
          cursor-default select-none
          ${className}
        `}
        title={tooltipContent}
      >
        <span className="flex items-center gap-1">
          <span className="font-bold">{score}%</span>
          <span className="text-xs opacity-90">({getStatusText()})</span>
        </span>
      </div>
      
      {/* Optional: Animated pulse for high scores */}
      {score >= 80 && (
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-400 opacity-20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

// Export a simpler version without animations for performance-critical areas
export const ScoreBadgeSimple: React.FC<ScoreBadgeProps> = ({ 
  score, 
  size = 'md',
  className = ''
}) => {
  const getColorClasses = () => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={`
        inline-flex items-center justify-center rounded-full 
        ${getColorClasses()} 
        text-white font-semibold ${sizeClasses[size]} 
        shadow-sm
        ${className}
      `}
    >
      {score}%
    </div>
  );
}; 