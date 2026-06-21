import React from 'react';
import Image from "next/image";

export interface OAuthButtonProps {
  provider: 'google' | 'github' | 'apple';
  onClick: () => void;
}

/**
 * Simple OAuth button that displays the provider's logo (only Google implemented for now).
 * The button matches the existing UI style for the auth pages.
 */
export function OAuthButton({ provider, onClick }: OAuthButtonProps) {
  const getProviderInfo = () => {
    switch (provider) {
      case 'google':
        return { src: '/google.svg', alt: 'Google' };
      // Add more providers here as needed.
      default:
        return { src: '', alt: '' };
    }
  };

  const { src: icon } = getProviderInfo();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-transparent border border-white/10 text-white/80 font-medium text-sm py-3 rounded-lg hover:bg-white/[0.02] hover:text-white transition-all flex items-center justify-center gap-2 group"
    >
      {icon && (
        <Image
          src={icon}
          alt={provider}
          width={20}
          height={20}
          className="opacity-80 group-hover:opacity-100 transition-opacity"
        />
      )}
      Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}
    </button>
  );
}
