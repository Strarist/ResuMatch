'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** @deprecated Use /opportunities instead — redirects to the live opportunity matcher. */
export default function MatchesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/opportunities');
  }, [router]);
  return null;
}
