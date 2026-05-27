"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import * as auth from "./auth";
import { apiClient, LoginRequest } from "./api";
import { useRouter } from "next/navigation";

export enum AuthRuntimeState {
  INITIALIZING = "INITIALIZING",
  AUTHENTICATED = "AUTHENTICATED",
  ANONYMOUS = "ANONYMOUS",
  DEGRADED = "DEGRADED"
}

interface AuthContextType {
  user: auth.User | null;
  isAuthenticated: boolean;
  runtimeState: AuthRuntimeState;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithToken: (token: string) => void;
  logout: () => Promise<void>;
  loading: boolean;
  sessionExpired: boolean;
  setUser: (user: auth.User | null) => void;
  refreshUser: () => Promise<void>;
  isOffline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<auth.User | null>(null);
  const [runtimeState, setRuntimeState] = useState<AuthRuntimeState>(AuthRuntimeState.INITIALIZING);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await apiClient.getProfile();
        if (response.offline) {
          setUser(null);
          setRuntimeState(AuthRuntimeState.DEGRADED);
        } else if (response.user) {
          setUser({
            sub: response.user.id,
            email: response.user.email,
            provider: response.user.provider,
            name: response.user.name,
            profile_img: response.user.profile_img,
            exp: Date.now() + 86400000,
          });
          setRuntimeState(AuthRuntimeState.AUTHENTICATED);
        } else {
          setUser(null);
          setRuntimeState(AuthRuntimeState.ANONYMOUS);
        }
      } catch {
        // Unexpected errors (not 401 which are handled silently in api.ts)
        setUser(null);
        setRuntimeState(AuthRuntimeState.ANONYMOUS);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    const response = await apiClient.login(credentials);
    setUser({
      sub: response.user.id,
      email: response.user.email,
      provider: response.user.provider,
      name: response.user.name,
      profile_img: response.user.profile_img,
      exp: Date.now() + 86400000,
    });
    setSessionExpired(false);
  }, []);

  const handleLoginWithToken = useCallback(() => {
    // Legacy support for OAuth redirect if needed
  }, []);

  const handleLogout = useCallback(async () => {
    try { await apiClient.logout(); } catch { /* non-critical */ }
    setUser(null);
    setSessionExpired(false);
    router.push('/');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getProfile();
      if (response.user) {
        setUser((prev) => prev ? { ...prev, name: response.user!.name, profile_img: response.user!.profile_img } : null);
      }
    } catch { /* non-critical */ }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    runtimeState,
    login: handleLogin,
    loginWithToken: handleLoginWithToken,
    logout: handleLogout,
    loading: runtimeState === AuthRuntimeState.INITIALIZING,
    sessionExpired,
    setUser,
    refreshUser,
    isOffline: runtimeState === AuthRuntimeState.DEGRADED,
  }), [user, runtimeState, sessionExpired, handleLogin, handleLoginWithToken, handleLogout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
