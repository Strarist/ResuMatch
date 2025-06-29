import { useAuth } from './AuthContext';
import { getValidToken } from './auth';
import { useCallback } from 'react';

interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export function useApi() {
  const { logout } = useAuth();

  const request = useCallback(async <T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    const { requireAuth = true, ...fetchOptions } = options;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      credentials: 'include',
      ...fetchOptions,
    };

    // Add auth token if required
    if (requireAuth) {
      const token = await getValidToken();
      if (!token) {
        await logout();
        throw new Error('Authentication required');
      }
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await logout();
          throw new Error('Session expired');
        }
        throw new Error(data.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }, [logout]);

  return { request };
} 