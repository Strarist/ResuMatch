import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ScrollableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both';
  snapType?: 'none' | 'x' | 'y' | 'both';
  snapAlign?: 'start' | 'center' | 'end';
  hideScrollbar?: boolean;
  className?: string;
}

export const Scrollable = forwardRef<HTMLDivElement, ScrollableProps>(
  (
    {
      children,
      direction = 'vertical',
      snapType = 'none',
      snapAlign = 'start',
      hideScrollbar = false,
      className,
      ...props
    },
    ref
  ) => {
    const directionClasses = {
      vertical: 'overflow-y-auto overflow-x-hidden',
      horizontal: 'overflow-x-auto overflow-y-hidden',
      both: 'overflow-auto',
    };

    const snapTypeClasses = {
      none: '',
      x: 'snap-x snap-mandatory',
      y: 'snap-y snap-mandatory',
      both: 'snap-both snap-mandatory',
    };

    const snapAlignClasses = {
      start: 'snap-start',
      center: 'snap-center',
      end: 'snap-end',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative',
          directionClasses[direction],
          snapType !== 'none' && snapTypeClasses[snapType],
          hideScrollbar && 'scrollbar-hide',
          !hideScrollbar && [
            'scrollbar-thin',
            'scrollbar-track-gray-100 dark:scrollbar-track-gray-800',
            'scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
            'hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500',
          ],
          className
        )}
        {...props}
      >
        {snapType !== 'none' ? (
          <div className={cn('flex', direction === 'vertical' ? 'flex-col' : 'flex-row')}>
            {React.Children.map(children, (child) => (
              <div className={snapAlignClasses[snapAlign]}>{child}</div>
            ))}
          </div>
        ) : (
          children
        )}
      </motion.div>
    );
  }
);

Scrollable.displayName = 'Scrollable';

// Example usage:
// <Scrollable
//   direction="horizontal"
//   snapType="x"
//   snapAlign="center"
//   className="h-64"
// >
//   {items.map((item) => (
//     <div key={item.id} className="w-64 flex-shrink-0">
//       {item.content}
//     </div>
//   ))}
// </Scrollable> 