"use client";

import { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { isTokenExpired } from '@/auth/auth';
import toast from 'react-hot-toast';

export default function SessionManager() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (isTokenExpired()) {
        toast.error('Your session has expired. Please log in again.');
        logout();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, logout]);

  return null;
}
