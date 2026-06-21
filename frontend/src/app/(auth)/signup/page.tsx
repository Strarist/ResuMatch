"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/auth/AuthContext";
import { apiClient, ApiError } from "@/auth/api";
import * as auth from "@/auth/auth";

// Shared auth UI components
import { AuthLayout } from "@/components/auth/AuthLayout";
import { StoryPanel } from "@/components/auth/StoryPanel";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from '@/components/ui/button';
import { DividerWithLabel } from "@/components/auth/DividerWithLabel";
import { TrustBadge } from "@/components/auth/TrustBadge";
import { AuthPreviewCard } from "@/components/auth/AuthPreviewCard";

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
      const data = await apiClient.register({ name, email, password });
      if (data.access_token) {
        auth.login(data.access_token);
      }
      setUser({
        sub: data.user.id,
        email: data.user.email,
        provider: data.user.provider,
        name: data.user.name,
        profile_img: data.user.profile_img,
        exp: Date.now() + 86400000,
      });
      router.replace("/onboarding");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const oauthUrl = apiClient.getOAuthUrl('google');
    window.location.href = oauthUrl;
  };

  // Left panel content
  const leftContent = (
    <StoryPanel
      headline="Smart tools for your career growth."
      subheadline="Set up your Skillyn profile to get tailored learning goals and matching job opportunities."
      highlights={["Match Score", "Roadmap", "Opportunities"]}
    >
      <AuthPreviewCard />
    </StoryPanel>
  );

  // Right panel content
  const rightContent = (
    <div className="w-full max-w-sm">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white mb-6 focus:outline-none focus:ring-1 focus:ring-white/30 rounded py-1 px-2 hover:bg-white/[0.04] transition-colors" aria-label="Back to home">
        &larr; Back to Home
      </Link>
      <div className="mb-8">
        <h2 className="text-2xl font-medium tracking-tight mb-2">Sign Up</h2>
        <p className="text-sm text-white/40">Set up your Skillyn profile.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <AuthInput type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <AuthInput type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
        <AuthInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 h-12 rounded-lg hover:bg-white/90 transition-all flex items-center justify-center text-sm shadow-md"
        >
          {loading ? "Creating..." : "Create Account"}
        </Button>
        {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
      </form>
      <DividerWithLabel label="OR" />
      <OAuthButton provider="google" onClick={handleGoogleSignup} />
      <p className="mt-8 text-xs text-center text-white/30">
        Already have an account? <Link href="/login" className="text-white/60 hover:text-white transition-colors">Sign In</Link>
      </p>
      <TrustBadge messages={["SOC2‑Ready Infrastructure", "Encrypted Processing", "OAuth Secure Sessions"]} />
    </div>
  );

  return <AuthLayout left={leftContent} right={rightContent} />;
}
