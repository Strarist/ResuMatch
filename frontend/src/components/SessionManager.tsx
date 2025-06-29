"use client";

import { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { validateAndRefreshToken } from '@/auth/auth';
import toast from 'react-hot-toast';

export default function SessionManager() {
  const { user, sessionExpired, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Check token validity every 5 minutes
    const interval = setInterval(async () => {
      try {
        const isValid = await validateAndRefreshToken();
        if (!isValid) {
          toast.error('Your session has expired. Please log in again.');
          await logout();
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Show warning 2 minutes before expiry
    const now = Date.now();
    const exp = user.exp * 1000;
    const warningTime = exp - (2 * 60 * 1000); // 2 minutes before expiry
    
    if (warningTime > now) {
      const warningTimeout = setTimeout(() => {
        toast(
          'Your session will expire soon. Consider refreshing the page.',
          {
            duration: 10000,
            icon: '⚠️',
          }
        );
      }, warningTime - now);

      return () => {
        clearInterval(interval);
        clearTimeout(warningTimeout);
      };
    }

    return () => clearInterval(interval);
  }, [user, logout]);

  // Show session expired notification
  useEffect(() => {
    if (sessionExpired) {
      toast.error('Your session has expired. Please log in again.', {
        duration: 0, // Don't auto-dismiss
        id: 'session-expired',
      });
    } else {
      toast.dismiss('session-expired');
    }
  }, [sessionExpired]);

  return null; // This component doesn't render anything
} 