import { forwardRef, SelectHTMLAttributes, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
}

interface NeomorphicSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  options: Option[];
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}

export const NeomorphicSelect = forwardRef<HTMLSelectElement, NeomorphicSelectProps>(
  ({ label, options, error, helperText, icon, className, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
      setHasValue(e.target.value.length > 0);
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
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-lg bg-transparent px-4 py-3 text-gray-900 dark:text-white',
              'focus:outline-none',
              icon && 'pl-10',
              error ? 'border-red-500' : 'border-transparent'
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          >
            <option value="" disabled>
              {label}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDownIcon
              className={cn(
                'h-5 w-5 transition-transform duration-200',
                isFocused && 'rotate-180',
                'text-gray-400 dark:text-gray-500'
              )}
            />
          </div>
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
        <AnimatePresence>
          {(error || helperText) && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'mt-1 text-sm',
                error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {error || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

NeomorphicSelect.displayName = 'NeomorphicSelect';

// Example usage:
// <NeomorphicSelect
//   label="Job Type"
//   options={[
//     { value: 'full-time', label: 'Full Time' },
//     { value: 'part-time', label: 'Part Time' },
//     { value: 'contract', label: 'Contract' },
//   ]}
//   icon={<BriefcaseIcon className="h-5 w-5" />}
//   error={errors.jobType?.message}
//   helperText="Select your preferred job type"
// /> 