import React from 'react';

interface ProgressBarProps {
  percent: number;
  label?: string;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percent, label, className }) => (
  <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden relative ${className || ''}`}>
    <div
      className="h-full bg-blue-500 transition-all duration-300"
      style={{ width: `${percent}%` }}
    />
    {label && (
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-700 font-medium">
        {label}
      </span>
    )}
  </div>
);

export default ProgressBar; 