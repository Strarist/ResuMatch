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
  const { isAuthenticated, loading, sessionExpired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait for auth to initialize

    if (requireAuth && !isAuthenticated) {
      // Store the intended destination for post-login redirect
      if (pathname !== '/login' && pathname !== '/signup') {
        sessionStorage.setItem('redirectAfterLogin', pathname);
      }
      router.push(redirectTo);
      return;
    }

    if (!requireAuth && isAuthenticated) {
      // If user is authenticated and trying to access login/signup, redirect to dashboard
      if (pathname === '/login' || pathname === '/signup') {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router, pathname]);

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  // Show session expired message
  if (sessionExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl font-semibold mb-4">
            Session Expired
          </div>
          <p className="text-gray-400 mb-6">
            Your session has expired. Please log in again.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If auth requirements are met, render children
  if ((requireAuth && isAuthenticated) || (!requireAuth && !isAuthenticated)) {
    return <>{children}</>;
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
    </div>
  );
} 