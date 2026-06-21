'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isDevModeEnabled, isDevOnlyRoute } from '@/lib/dev-mode';

export function DevRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || !isDevOnlyRoute(pathname)) return;
    if (isDevModeEnabled()) return;
    toast.info('This page is available in dev mode only. Add ?dev=true to the URL or set NEXT_PUBLIC_DEV_MODE=true.');
    router.replace('/dashboard');
  }, [pathname, router]);

  return <>{children}</>;
}
