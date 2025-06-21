import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initializeAuth } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
      },
      initialize: () => {
        // Initialize API auth first
        initializeAuth();
        
        const token = localStorage.getItem('token');
        if (token && !get().isAuthenticated) {
          // Auto-login with test user for development
          set({
            user: {
              id: '2',
              email: 'test@example.com',
              name: 'Test User'
            },
            token,
            isAuthenticated: true
          });
          console.log('🔑 Auto-logged in with test user');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 