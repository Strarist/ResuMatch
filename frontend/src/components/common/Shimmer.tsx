import { motion } from 'framer-motion';

interface ShimmerProps {
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  height?: string;
  width?: string;
}

export const Shimmer = ({ className = '', rounded = 'md', height = 'h-4', width = 'w-full' }: ShimmerProps) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <motion.div
      className={`
        ${width}
        ${height}
        ${roundedClasses[rounded]}
        bg-gradient-to-r
        from-gray-200 via-gray-100 to-gray-200
        dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
        animate-shimmer
        ${className}
      `}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  );
};

// Example usage:
// <div className="space-y-3">
//   <Shimmer height="h-4" width="w-3/4" />
//   <Shimmer height="h-4" width="w-1/2" />
//   <Shimmer height="h-4" width="w-5/6" />
// </div> 