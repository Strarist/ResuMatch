"use client";

import { useAuth } from '@/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !isAuthenticated) {
      // Store intended destination for post-login redirect
      if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
        sessionStorage.setItem('redirectAfterLogin', pathname);
      }
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, pathname]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <div className="text-xs font-mono text-white/40 tracking-widest uppercase">Checking session...</div>
        </div>
      </div>
    );
  }

  // Protected route: only render if authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
          <div className="text-xs font-mono text-white/40 tracking-widest uppercase">Checking session...</div>
        </div>
      </div>
    );
  }

  // Public route (requireAuth=false): always render children
  return <>{children}</>;
}
