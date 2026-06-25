"use client";

import { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { isTokenExpired, isTokenExpiringSoon, login as persistToken } from '@/auth/auth';
import { apiClient } from '@/auth/api';
import { toast } from 'sonner';

export default function SessionManager() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (isTokenExpiringSoon() && !isTokenExpired()) {
        try {
          const { access_token } = await apiClient.refreshToken();
          if (access_token) {
            persistToken(access_token);
            return;
          }
        } catch {
          /* fall through to expiry handling */
        }
      }

      if (isTokenExpired()) {
        try {
          const { access_token } = await apiClient.refreshToken();
          if (access_token) {
            persistToken(access_token);
            return;
          }
        } catch {
          toast.error('Your session has expired. Please log in again.');
          logout();
        }
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, logout]);

  return null;
}
