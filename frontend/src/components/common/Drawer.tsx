import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  className = '',
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-0 h-full w-80';
      case 'right':
        return 'right-0 top-0 h-full w-80';
      case 'top':
        return 'top-0 left-0 w-full h-80';
      case 'bottom':
        return 'bottom-0 left-0 w-full h-80';
      default:
        return 'right-0 top-0 h-full w-80';
    }
  };

  const getAnimationVariants = () => {
    switch (position) {
      case 'left':
        return {
          hidden: { x: '-100%' },
          visible: { x: 0 },
        };
      case 'right':
        return {
          hidden: { x: '100%' },
          visible: { x: 0 },
        };
      case 'top':
        return {
          hidden: { y: '-100%' },
          visible: { y: 0 },
        };
      case 'bottom':
        return {
          hidden: { y: '100%' },
          visible: { y: 0 },
        };
      default:
        return {
          hidden: { x: '100%' },
          visible: { x: 0 },
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={getAnimationVariants()}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed z-50 bg-white dark:bg-gray-800 shadow-xl ${getPositionClasses()} ${className}`}
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 