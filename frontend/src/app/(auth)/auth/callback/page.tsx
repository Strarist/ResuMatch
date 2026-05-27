'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';

function CallbackHandler() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    if (token) {
      loginWithToken(token);
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.replace(redirectTo);
    } else {
      router.replace('/login?error=no_token');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      <span className="ml-4 text-gray-300">Signing you in...</span>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" /></div>}>
      <CallbackHandler />
    </Suspense>
  );
}
