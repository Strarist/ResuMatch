"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as auth from "./auth";

interface AuthContextType {
  user: auth.User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Silent rehydration
    const u = auth.getUser();
    setUser(u);
    setLoading(false);
    if (u && auth.isTokenExpired()) {
      setSessionExpired(true);
      auth.logout();
      setUser(null);
    }
  }, []);

  const handleLogin = (token: string) => {
    auth.login(token);
    setUser(auth.getUser());
    setSessionExpired(false);
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
    setSessionExpired(false);
  };

  // Watch for token expiry while app is open
  useEffect(() => {
    if (!user) return;
    const now = Date.now();
    const exp = user.exp * 1000;
    if (exp <= now) {
      setSessionExpired(true);
      handleLogout();
    } else {
      const timeout = setTimeout(() => {
        setSessionExpired(true);
        handleLogout();
      }, exp - now);
      return () => clearTimeout(timeout);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !auth.isTokenExpired(),
        login: handleLogin,
        logout: handleLogout,
        loading,
        sessionExpired,
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
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
} 