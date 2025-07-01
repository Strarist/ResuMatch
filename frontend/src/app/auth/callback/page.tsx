'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useAuth();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          router.replace('/dashboard');
        } else {
          router.replace('/login?error=auth');
        }
      })
      .catch(() => {
        router.replace('/login?error=auth');
      });
  }, [router, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <span>Signing you in...</span>
    </div>
  );
} 