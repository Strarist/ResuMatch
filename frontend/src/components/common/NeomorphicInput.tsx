import React from "react";
import { cn } from "../../lib/utils";

export interface NeomorphicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeomorphicInput = React.forwardRef<HTMLInputElement, NeomorphicInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      style={{
        color: 'var(--input-text-color, #111)',
        background: 'var(--input-bg-color, #fff)',
        ...props.style,
      }}
      className={cn(
        "block w-full rounded-lg px-4 py-2 transition-all duration-200",
        "bg-white dark:bg-gray-900 !text-gray-900 dark:!text-white",
        "placeholder-gray-400 dark:placeholder-gray-500",
        "border border-gray-300 dark:border-gray-700 border-solid",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
        "shadow-sm",
        "!text-[1rem]",
        className
      )}
      {...props}
    />
  )
);

NeomorphicInput.displayName = "NeomorphicInput";
export default NeomorphicInput;

// Example usage:
// <NeomorphicInput
//   label="Email"
//   type="email"
//   icon={<MailIcon className="h-5 w-5" />}
//   error={errors.email?.message}
//   helperText="We'll never share your email"
// /> 