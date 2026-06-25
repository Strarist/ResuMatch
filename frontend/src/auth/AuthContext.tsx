"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import * as auth from "./auth";
import { apiClient, LoginRequest, ApiError } from "./api";
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
        const token = auth.getToken();
        if (!token || auth.isTokenExpired()) {
          if (token && auth.isTokenExpired()) {
            try {
              const { access_token } = await apiClient.refreshToken();
              if (access_token) {
                auth.login(access_token);
              } else {
                auth.logout();
                setUser(null);
                setRuntimeState(AuthRuntimeState.ANONYMOUS);
                return;
              }
            } catch {
              auth.logout();
              setUser(null);
              setRuntimeState(AuthRuntimeState.ANONYMOUS);
              return;
            }
          } else {
            setUser(null);
            setRuntimeState(AuthRuntimeState.ANONYMOUS);
            return;
          }
        }

        const response = await apiClient.getProfile();
        if (response.offline) {
          setUser(null);
          setRuntimeState(AuthRuntimeState.DEGRADED);
        } else if (response.user) {
          if (response.access_token) {
            auth.login(response.access_token);
          }
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
      } catch (error: unknown) {
        // Suppress console logging for expected anonymous guest state (401)
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          setRuntimeState(AuthRuntimeState.ANONYMOUS);
          return;
        }

        // Unexpected network or application errors should still be logged for diagnostics
        console.error("Unexpected authentication initialization error:", error);
        setUser(null);
        setRuntimeState(AuthRuntimeState.ANONYMOUS);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    const response = await apiClient.login(credentials);
    if (response.access_token) {
      auth.login(response.access_token);
    }
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

  const handleLoginWithToken = useCallback((token: string) => {
    auth.login(token);
    const decoded = auth.getUser();
    if (decoded) {
      setUser(decoded);
      setRuntimeState(AuthRuntimeState.AUTHENTICATED);
      setSessionExpired(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try { await apiClient.logout(); } catch { /* non-critical */ }
    auth.logout();
    setUser(null);
    setSessionExpired(false);
    router.push('/');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const token = auth.getToken();
      if (!token || auth.isTokenExpired()) return;
      const response = await apiClient.getProfile();
      if (response.user) {
        setUser({
          sub: response.user.id,
          email: response.user.email,
          provider: response.user.provider,
          name: response.user.name,
          profile_img: response.user.profile_img,
          exp: Date.now() + 86400000,
        });
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
