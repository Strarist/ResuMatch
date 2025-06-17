import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoadingBlurProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  blurAmount?: number;
  shimmerColor?: string;
}

export const LoadingBlur = ({
  isLoading,
  children,
  className,
  blurAmount = 4,
  shimmerColor = 'rgba(255, 255, 255, 0.1)',
}: LoadingBlurProps) => {
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <div
              className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              style={{ backdropFilter: `blur(${blurAmount}px)` }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent 0%,
                  ${shimmerColor} 50%,
                  transparent 100%
                )`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className={cn(isLoading && 'pointer-events-none')}>{children}</div>
    </div>
  );
};

// Example usage:
// <LoadingBlur
//   isLoading={isLoading}
//   className="rounded-lg overflow-hidden"
// >
//   <div className="p-4">
//     <h2 className="text-lg font-semibold">Content Title</h2>
//     <p className="mt-2">Content description goes here...</p>
//   </div>
// </LoadingBlur> 