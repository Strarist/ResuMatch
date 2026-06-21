import React from 'react';
import { Logo } from '@/branding/Logo';

type ClickableLogoProps = {
  size?: number;
  className?: string;
  showWordmark?: boolean;
};

/**
 * Presentational Logo wrapper to be styled and embedded by parent components.
 * Parents are responsible for wrapping this with appropriate Link/anchor tags.
 */
export function ClickableLogo({
  size = 40,
  className = '',
  showWordmark = true,
}: ClickableLogoProps) {
  return (
    <Logo
      size={size}
      showWordmark={showWordmark}
      className={className}
    />
  );
}

export default ClickableLogo;
