'use client';

import { useEffect, useState } from 'react';

export default function BackgroundLayers() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Subtle atmospheric shift: gradient moves down as user scrolls
  const gradientOffset = Math.min(scrollY * 0.02, 30);

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-[#060a14]" />
      <div
        className="absolute inset-0 transition-transform duration-[2000ms] ease-out will-change-transform"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% ${-20 + gradientOffset}%, rgba(59,130,246,0.035), transparent)`,
        }}
      />
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
    </div>
  );
}
