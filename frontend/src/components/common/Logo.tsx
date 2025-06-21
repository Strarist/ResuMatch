import React from 'react';

const Logo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="8" y="8" width="48" height="48" rx="10" fill="url(#bg)" />
    <rect x="16" y="16" width="32" height="32" rx="6" fill="#fff" fillOpacity="0.9" />
    <rect x="20" y="22" width="24" height="4" rx="2" fill="#6366f1" />
    <rect x="20" y="30" width="16" height="3" rx="1.5" fill="#a5b4fc" />
    <rect x="20" y="36" width="10" height="3" rx="1.5" fill="#a5b4fc" />
    <circle cx="44" cy="40" r="5" fill="#6366f1" />
    <path d="M41 40c0-1.66 1.34-3 3-3s3 1.34 3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="bg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#a5b4fc" />
      </linearGradient>
    </defs>
  </svg>
);

export default Logo; 