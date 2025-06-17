import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NeomorphicInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const NeomorphicInput = forwardRef<HTMLInputElement, NeomorphicInputProps>(
  ({ label, error, helperText, icon, className, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      onBlur?.(e);
    };

    return (
      <div className="relative w-full">
        <div
          className={cn(
            'relative rounded-lg transition-all duration-200',
            'bg-white dark:bg-gray-800',
            'shadow-neo-sm dark:shadow-neo-dark-sm',
            isFocused && 'shadow-neo-md dark:shadow-neo-dark-md',
            error && 'shadow-error-sm dark:shadow-error-dark-sm',
            className
          )}
        >
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg bg-transparent px-4 py-3 text-gray-900 dark:text-white',
              'placeholder-transparent focus:outline-none',
              icon && 'pl-10',
              error ? 'border-red-500' : 'border-transparent'
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          <motion.label
            initial={false}
            animate={{
              y: isFocused || hasValue ? -28 : 0,
              x: isFocused || hasValue ? (icon ? -24 : -8) : 0,
              scale: isFocused || hasValue ? 0.85 : 1,
            }}
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2',
              'text-sm text-gray-500 dark:text-gray-400',
              'transition-colors duration-200',
              (isFocused || hasValue) && 'text-primary-500 dark:text-primary-400',
              error && 'text-red-500 dark:text-red-400'
            )}
          >
            {label}
          </motion.label>
        </div>
        {(error || helperText) && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-1 text-sm',
              error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </motion.p>
        )}
      </div>
    );
  }
);

NeomorphicInput.displayName = 'NeomorphicInput';

// Example usage:
// <NeomorphicInput
//   label="Email"
//   type="email"
//   icon={<MailIcon className="h-5 w-5" />}
//   error={errors.email?.message}
//   helperText="We'll never share your email"
// /> 