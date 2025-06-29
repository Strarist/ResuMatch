"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import * as auth from "./auth";
import { apiClient, LoginRequest } from "./api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: auth.User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithToken: (token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  sessionExpired: boolean;
  setUser: (user: auth.User | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isValid = await auth.validateAndRefreshToken();
        if (isValid) {
          const currentUser = auth.getUser();
          setUser(currentUser);
        } else {
          setSessionExpired(true);
          auth.logout();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        auth.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle login with credentials
  const handleLogin = async (credentials: LoginRequest) => {
    try {
      const response = await apiClient.login(credentials);
      auth.login(response.access_token);
      const user = auth.getUser();
      setUser(user);
      setSessionExpired(false);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Handle login with token (for OAuth)
  const handleLoginWithToken = (token: string) => {
    auth.login(token);
    const user = auth.getUser();
    setUser(user);
    setSessionExpired(false);
  };

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      auth.logout();
      setUser(null);
      setSessionExpired(false);
      router.push('/login');
    }
  }, [router]);

  // Refresh user data from server
  const refreshUser = async () => {
    try {
      const response = await apiClient.getProfile();
      const currentUser = auth.getUser();
      if (currentUser) {
        setUser({
          ...currentUser,
          name: response.user.name,
          profile_img: response.user.profile_img,
        });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Watch for token expiry and auto-refresh
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = async () => {
      const isValid = await auth.validateAndRefreshToken();
      if (!isValid) {
        setSessionExpired(true);
        await handleLogout();
      } else {
        const updatedUser = auth.getUser();
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    
    // Also check when the token is about to expire
    const now = Date.now();
    const exp = user.exp * 1000;
    const timeUntilExpiry = exp - now;
    
    if (timeUntilExpiry > 0) {
      const timeout = setTimeout(checkTokenExpiry, timeUntilExpiry - 60000); // 1 minute before expiry
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => clearInterval(interval);
  }, [user, handleLogout]);

  useEffect(() => {
    if (sessionExpired) {
      handleLogout();
    }
  }, [sessionExpired, handleLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !auth.isTokenExpired(),
        login: handleLogin,
        loginWithToken: handleLoginWithToken,
        logout: handleLogout,
        loading,
        sessionExpired,
        setUser,
        refreshUser,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 