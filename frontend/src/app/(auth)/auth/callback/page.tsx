'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/auth/AuthContext';

function CallbackHandler() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const error = searchParams.get('error');
    const detail = searchParams.get('detail');
    if (error) {
      const params = new URLSearchParams({ error });
      if (detail) params.set('detail', detail);
      router.replace(`/login?${params.toString()}`);
      return;
    }

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

function OAuthErrorView({ error, detail }: { error: string; detail: string | null }) {
  const messages: Record<string, string> = {
    oauth_failed: 'Google sign-in failed. Please try again.',
    oauth_not_configured: 'Google OAuth is not configured on this server.',
    no_token: 'No sign-in token was received. Please try again.',
  };
  const message = detail || messages[error] || 'Sign-in failed. Please try again.';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <p className="text-red-400 text-sm mb-4 max-w-md">{message}</p>
      <Link
        href="/login"
        className="rounded-lg px-4 py-2 bg-white text-black text-sm font-semibold hover:bg-white/90"
      >
        Back to sign in
      </Link>
    </div>
  );
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const detail = searchParams.get('detail');

  if (error) {
    return <OAuthErrorView error={error} detail={detail} />;
  }

  return <CallbackHandler />;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}
