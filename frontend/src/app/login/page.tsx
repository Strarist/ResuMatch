"use client";

import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/auth/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/auth/api";
import toast from "react-hot-toast";
import ProtectedRoute from '@/components/ProtectedRoute';

function LoginContent() {
  const { sessionExpired, loginWithToken, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOAuthSuccess = useCallback(async (code: string, state: string) => {
    try {
      // Exchange code for token
      const response = await apiClient.exchangeCodeForToken(code, state);
      loginWithToken(response.access_token);
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error('OAuth login failed:', error);
      toast.error('Failed to complete login');
    }
  }, [loginWithToken, router]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      handleOAuthSuccess(code, state);
    }
  }, [searchParams, handleOAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await login({ email, password });
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectTo);
      toast.success('Successfully logged in!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'linkedin') => {
    const oauthUrl = apiClient.getOAuthUrl(provider);
    window.location.href = oauthUrl;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-white/5 rounded-full blur-2xl" />
      </div>
      <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto flex flex-col items-center gap-8 animate-slide-in-bottom transition-all duration-300">
        {sessionExpired && (
          <div className="w-full mb-4 px-4 py-3 rounded-lg bg-red-500/90 text-white text-center font-semibold animate-bounce-in shadow-lg border border-red-400">
            Session expired – please log in again.
          </div>
        )}
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <Image src="/logo.svg" alt="ResuMatch Logo" width={80} height={80} className="mb-2 animate-spin-slow" />
          <h1 className="text-3xl font-extrabold text-white mb-2 animate-slide-in-bottom font-[Poppins,Inter,sans-serif] tracking-tight">Sign in to ResuMatch</h1>
          <p className="text-gray-300 mb-4 text-center animate-fade-in text-base font-medium" style={{ animationDelay: '0.2s' }}>
            Match your resume to jobs, visualize your skills, and land your dream role.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => handleOAuthLogin('google')}
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
          >
            <Image src="/google.svg" alt="Google" width={24} height={24} className="transition-transform group-hover:scale-110" />
            Sign in with Google
            <ArrowRightIcon className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => handleOAuthLogin('linkedin')}
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
          >
            <Image src="/linkedin.svg" alt="LinkedIn" width={24} height={24} className="transition-transform group-hover:scale-110" />
            Sign in with LinkedIn
            <ArrowRightIcon className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">or continue with email</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 bg-white/5 rounded-xl p-6 mt-2 shadow-inner border border-gray-700 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            {error && <div className="text-red-500 text-sm text-center mt-2 animate-fade-in">{error}</div>}
          </form>
        </div>
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <span className="text-gray-400">Not a member? </span>
          <Link href="/signup" className="text-blue-400 hover:underline">Sign up</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginContent />
    </ProtectedRoute>
  );
} 