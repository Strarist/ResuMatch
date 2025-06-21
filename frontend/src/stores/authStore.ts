import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { auth } = await import('../lib/api');
          const response = await auth.login(email, password);
          set({
            user: {
              id: response.user.id,
              email: response.user.email,
              full_name: response.user.full_name || '',
              is_active: response.user.is_active ?? true,
              created_at: response.user.created_at || '',
              updated_at: response.user.updated_at || '',
            },
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to login',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        try {
          set({ isLoading: true, error: null });
          const { auth } = await import('../lib/api');
          const response = await auth.register({ 
            email, 
            password, 
            full_name: fullName
          });
          set({
            user: {
              id: response.user.id,
              email: response.user.email,
              full_name: response.user.full_name || '',
              is_active: response.user.is_active ?? true,
              created_at: response.user.created_at || '',
              updated_at: response.user.updated_at || '',
            },
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to register',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
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