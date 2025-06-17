import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';

interface NeomorphicCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
}

export const NeomorphicCheckbox = forwardRef<HTMLInputElement, NeomorphicCheckboxProps>(
  ({ label, error, helperText, className, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className="relative">
        <label className="flex items-start space-x-3">
          <div className="relative flex h-5 w-5 flex-shrink-0">
            <input
              ref={ref}
              type="checkbox"
              className="peer sr-only"
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...props}
            />
            <div
              className={cn(
                'relative h-5 w-5 rounded transition-all duration-200',
                'bg-white dark:bg-gray-800',
                'shadow-neo-sm dark:shadow-neo-dark-sm',
                isFocused && 'shadow-neo-md dark:shadow-neo-dark-md',
                error && 'shadow-error-sm dark:shadow-error-dark-sm',
                'peer-checked:bg-primary-500 peer-checked:dark:bg-primary-400',
                'peer-checked:shadow-none',
                className
              )}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: props.checked ? 1 : 0,
                  opacity: props.checked ? 1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <CheckIcon className="h-4 w-4 text-white" />
              </motion.div>
            </div>
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                'text-sm font-medium',
                'text-gray-900 dark:text-white',
                error && 'text-red-500 dark:text-red-400'
              )}
            >
              {label}
            </span>
            {(error || helperText) && (
              <motion.span
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'mt-0.5 text-sm',
                  error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {error || helperText}
              </motion.span>
            )}
          </div>
        </label>
      </div>
    );
  }
);

NeomorphicCheckbox.displayName = 'NeomorphicCheckbox';

// Example usage:
// <NeomorphicCheckbox
//   label="I agree to the terms and conditions"
//   error={errors.terms?.message}
//   helperText="You must agree to continue"
// /> 