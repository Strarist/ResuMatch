/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { apiClient } from "@/auth/api";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { Brain, Radar, TrendingUp } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      setUser(data.user);
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const oauthUrl = apiClient.getOAuthUrl('google');
    window.location.href = oauthUrl;
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* LEFT PANEL - Intelligence Story */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-white/[0.08] relative bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-transparent pointer-events-none" />

        <div className="relative z-10 animate-fade-in">
          <Image src="/logo.svg" alt="ResuMatch" width={40} height={40} className="mb-12 opacity-80" />

          <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Persistent intelligence<br />for career growth.
          </h1>
          <p className="text-white/40 text-lg font-light max-w-md">
            Your career trajectory compounds over time. Initialize your operating system to build a strategic intelligence baseline.
          </p>
        </div>

        {/* Intelligence Feed Simulation */}
        <div className="relative z-10 space-y-4 max-w-md mt-16 animate-slide-in-bottom opacity-80" style={{ animationDelay: '0.2s' }}>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] flex gap-3 items-start">
            <Brain size={16} className="text-violet-400 mt-1" />
            <div>
              <p className="text-sm text-white/70">Match Accuracy: 94%</p>
              <p className="text-xs text-white/40">Market alignment recalibrated based on recent structural metrics.</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] flex gap-3 items-start">
            <Radar size={16} className="text-cyan-400 mt-1" />
            <div>
              <p className="text-sm text-white/70">Recruiter Readiness: Optimizing</p>
              <p className="text-xs text-white/40">New opportunity path detected. Awaiting initial portfolio hydration.</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.05] flex gap-3 items-start">
            <TrendingUp size={16} className="text-emerald-400 mt-1" />
            <div>
              <p className="text-sm text-white/70">Execution Consistency</p>
              <p className="text-xs text-white/40">Ready to build longitudinal memory across career execution states.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-8 flex gap-6 text-xs text-white/30">
          <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4" /> SOC2-Ready Infrastructure</span>
          <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4" /> Encrypted Processing</span>
        </div>
      </div>

      {/* RIGHT PANEL - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-medium tracking-tight mb-2">Create Account</h2>
            <p className="text-sm text-white/40">Initialize your career intelligence system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
                required
              />
            </div>
            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
                required
              />
            </div>
            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium text-sm py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Initializing..." : "Continue with Email"}
            </button>
            {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
          </form>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-white/[0.08]"></div>
            <span className="flex-shrink-0 px-4 text-xs text-white/20">OR</span>
            <div className="flex-grow border-t border-white/[0.08]"></div>
          </div>

          <button
            onClick={handleGoogleSignup}
            type="button"
            className="w-full bg-transparent border border-white/10 text-white/80 font-medium text-sm py-3 rounded-lg hover:bg-white/[0.02] hover:text-white transition-all flex items-center justify-center gap-2 group"
          >
            <img src="/google.svg" alt="Google" width={18} height={18} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            Continue with Google
          </button>

          <p className="mt-8 text-xs text-center text-white/30">
            Already have an account? <a href="/login" className="text-white/60 hover:text-white transition-colors">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
