"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/auth/AuthContext";
import { apiClient, ApiError } from "@/auth/api";



// Shared auth UI components
import { AuthLayout } from "@/components/auth/AuthLayout";
import { StoryPanel } from "@/components/auth/StoryPanel";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { Button } from '@/components/ui/button';
import { DividerWithLabel } from "@/components/auth/DividerWithLabel";
import { TrustBadge } from "@/components/auth/TrustBadge";

function LoginQueryParams({ onError }: { onError: (err: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const detailParam = searchParams.get("detail");
    if (errorParam) {
      onError(detailParam || errorParam);
    }
  }, [searchParams, onError]);
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const oauthUrl = apiClient.getOAuthUrl('google');
    window.location.href = oauthUrl;
  };

  // Left‑hand story content
  const leftContent = (
    <StoryPanel
      headline="Welcome back to Skillyn."
      subheadline="Continue building your career path. Your roadmap and upskilling goals are ready."
    >
      <TrustBadge messages={["OAuth Secure Sessions", "Recruiter‑Safe Visibility"]} />
    </StoryPanel>
  );

  // Right‑hand form content
  const rightContent = (
    <div className="w-full max-w-sm">
      <Link href="/" className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white mb-6 focus:outline-none focus:ring-1 focus:ring-white/30 rounded py-1 px-2 hover:bg-white/[0.04] transition-colors" aria-label="Back to home">
        &larr; Back to Home
      </Link>
      <div className="mb-8">
        <h2 className="text-2xl font-medium tracking-tight mb-2">Sign In</h2>
        <p className="text-sm text-white/40">Access your Skillyn profile.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <AuthInput type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
        <AuthInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Button
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 h-12 rounded-lg hover:bg-white/90 transition-all flex items-center justify-center text-sm shadow-md"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </Button>
        {error && <div className="text-red-400 text-xs mt-2">{error}</div>}
      </form>
      <DividerWithLabel label="OR" />
      <OAuthButton provider="google" onClick={handleGoogleLogin} />
      <Suspense fallback={null}>
        <LoginQueryParams onError={setError} />
      </Suspense>
      <p className="mt-8 text-xs text-center text-white/30">
        Don&#39;t have an account? <Link href="/signup" className="text-white/60 hover:text-white transition-colors">Sign Up</Link>
      </p>
    </div>
  );

  return <AuthLayout left={leftContent} right={rightContent} />;
}
