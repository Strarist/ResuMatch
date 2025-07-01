"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { apiClient } from "@/auth/api";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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
      setUser(data.user);
      router.replace("/dashboard");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
      <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-auto flex flex-col items-center gap-8 animate-slide-in-bottom transition-all duration-300">
        <Image src="/logo.svg" alt="ResuMatch Logo" width={48} height={48} className="h-12 w-12 mb-2 animate-fade-in" />
        <h1 className="text-3xl font-extrabold text-white mb-2 animate-slide-in-bottom font-[Poppins,Inter,sans-serif] tracking-tight">Sign Up</h1>
        <p className="text-gray-300 mb-4 text-center animate-fade-in text-base font-medium" style={{ animationDelay: '0.2s' }}>
          Create your account to match your resume to jobs, visualize your skills, and land your dream role.
        </p>
        <Button
          onClick={handleGoogleSignup}
          className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
        >
          <img src="/google.svg" alt="Google" width={24} height={24} className="transition-transform group-hover:scale-110" />
          Sign up with Google
          <ArrowRightIcon className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
        <div className="relative my-4 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-400">or continue with email</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 bg-white/5 rounded-xl p-6 mt-2 shadow-inner border border-gray-700 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            required
          />
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
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
          {error && <div className="text-red-500 text-sm text-center mt-2 animate-fade-in">{error}</div>}
        </form>
        <p className="mt-4 text-gray-400 text-center">
          Already have an account? <a href="/login" className="text-blue-400 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
} 