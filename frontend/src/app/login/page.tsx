"use client";

import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/auth/AuthContext";

export default function LoginPage() {
  const { sessionExpired } = useAuth();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden animate-fade-in">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 bg-white/5 rounded-full blur-2xl" />
      </div>
      <div className="glass max-w-md w-full mx-auto p-10 rounded-2xl shadow-2xl border border-gray-800 flex flex-col items-center gap-8 animate-scale-in">
        {sessionExpired && (
          <div className="w-full mb-4 px-4 py-3 rounded-lg bg-red-500/90 text-white text-center font-semibold animate-bounce-in shadow-lg border border-red-400">
            Session expired – please log in again.
          </div>
        )}
        <Image src="/logo.svg" alt="ResuMatch Logo" width={64} height={64} className="mb-2 animate-fade-in" />
        <h1 className="text-3xl font-extrabold text-white mb-2 animate-slide-in-bottom">Sign in to ResuMatch</h1>
        <p className="text-gray-400 mb-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Match your resume to jobs, visualize your skills, and land your dream role.
        </p>
        <div className="flex flex-col gap-4 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <a
            href="https://resumatch-7nr2.onrender.com/v1/auth/google/login"
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg transition-all hover-scale active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Image src="/google.svg" alt="Google" width={24} height={24} />
            Sign in with Google
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </a>
        </div>
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <span className="text-gray-400">Not a member? </span>
          <Link href="/" className="text-blue-400 hover:underline">Learn more</Link>
        </div>
        {/* Placeholder for signed-in user */}
        <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <span className="text-gray-500 italic">Signed in as ...</span>
        </div>
      </div>
    </main>
  );
} 