import React from 'react';

export interface AuthInputProps {
  type: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

/**
 * Reusable input for authentication forms.
 * Matches the dark-themed style used across the app.
 */
export function AuthInput({ type, placeholder, value, onChange, required }: AuthInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
    />
  );
}
