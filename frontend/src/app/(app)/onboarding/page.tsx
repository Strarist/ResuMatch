"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Network, CheckCircle2, ArrowRight } from 'lucide-react';
import { LogoMark } from '@/branding/LogoMark';

type OnboardingState = {
  current_step: string;
  is_complete: string;
  target_role: string;
  specialization: string;
  experience_level: string;
  github_connected: string;
  linkedin_connected: string;
  growth_priority: string;
  execution_intensity: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingState>>({
    target_role: "",
    specialization: "",
    experience_level: "mid",
    growth_priority: "promotion",
    execution_intensity: "balanced",
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Partial save to backend
  const saveProgress = async (currentStepData: Partial<OnboardingState>, nextStep: number) => {
    setLoading(true);
    const token = localStorage.getItem('access_token');

    // We update state first
    const updatedData = { ...data, ...currentStepData, current_step: `step_${nextStep}` };
    setData(updatedData);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/onboarding/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedData)
      });

      if (!res.ok) {
        throw new Error(`Failed to save step: ${res.statusText}`);
      }
    } catch {
      console.error("Failed to save state");
    } finally {
      setLoading(false);
      setStep(nextStep);
    }
  };

  const handleFinalize = async () => {
    setInitializing(true);
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/onboarding/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_complete: "true", current_step: "done" })
      });
      // Simulate cinematic load
      setTimeout(() => {
        router.push('/dashboard');
      }, 3500);
    } catch {
      router.push('/dashboard');
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />

        <div className="max-w-md w-full relative z-10 flex flex-col items-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
            <LogoMark size={96} className="text-white relative z-10" />
          </div>
          <h2 className="text-2xl font-semibold mb-8 text-center tracking-tight">Initializing Intelligence Core</h2>

          <div className="w-full space-y-4 text-sm text-white/50 font-mono">
            <div className="flex justify-between items-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <span>Analyzing specialization graph...</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div className="flex justify-between items-center animate-fade-in opacity-0" style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}>
              <span>Recruiter positioning initialized...</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div className="flex justify-between items-center animate-fade-in opacity-0" style={{ animationDelay: '2.0s', animationFillMode: 'forwards' }}>
              <span>Opportunity adjacency graph built...</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <div className="flex justify-between items-center animate-fade-in opacity-0" style={{ animationDelay: '2.8s', animationFillMode: 'forwards' }}>
              <span>Execution baseline calibrated...</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
          </div>

          <div className="w-full bg-white/5 h-1 mt-10 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full animate-progress" style={{ width: '100%', transition: 'width 3s ease-in-out' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full border border-white/[0.08] rounded-2xl p-10 bg-[#0c0c0c] shadow-2xl relative overflow-hidden">

        {/* Step Indicator */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className={`h-1 rounded-full flex-1 transition-colors ${step >= idx ? 'bg-blue-500' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-medium tracking-tight mb-2">Establish Identity Baseline</h1>
              <p className="text-white/40 text-sm">Define your current market positioning to calibrate the intelligence engine.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block">Target Role</label>
                <input
                  type="text"
                  value={data.target_role}
                  onChange={(e) => setData({ ...data, target_role: e.target.value })}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block">Primary Specialization</label>
                <input
                  type="text"
                  value={data.specialization}
                  onChange={(e) => setData({ ...data, specialization: e.target.value })}
                  placeholder="e.g. Distributed Systems, ML Infrastructure"
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block">Experience Level</label>
                <select
                  value={data.experience_level}
                  onChange={(e) => setData({ ...data, experience_level: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-inner text-white appearance-none"
                >
                  <option value="junior">Junior (0-2 years)</option>
                  <option value="mid">Mid-Level (3-5 years)</option>
                  <option value="senior">Senior (5-8 years)</option>
                  <option value="staff">Staff/Principal (8+ years)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                onClick={() => saveProgress({}, 2)}
                disabled={loading}
                className="bg-white text-black font-medium text-sm py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-medium tracking-tight mb-2">Connect Proof Systems</h1>
              <p className="text-white/40 text-sm">Link external graphs to calculate portfolio maturity and real structural capability.</p>
            </div>

            <div className="space-y-4 mt-6">
              <div className="border border-white/10 rounded-xl p-5 flex items-center justify-between bg-black">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Network size={20} className="text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">GitHub Graph</h3>
                    <p className="text-xs text-white/40">Analyze commit density and architecture</p>
                  </div>
                </div>
                <button
                  onClick={() => setData({ ...data, github_connected: "true" })}
                  className={`text-xs font-medium px-4 py-2 rounded-md transition-colors ${data.github_connected === "true" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/80 hover:bg-white/10 border border-transparent"}`}
                >
                  {data.github_connected === "true" ? "Connected" : "Connect"}
                </button>
              </div>

              <div className="border border-white/10 rounded-xl p-5 flex items-center justify-between bg-black">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <Network size={20} className="text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">LinkedIn Network</h3>
                    <p className="text-xs text-white/40">Analyze recruiter visibility and network density</p>
                  </div>
                </div>
                <button
                  onClick={() => setData({ ...data, linkedin_connected: "true" })}
                  className={`text-xs font-medium px-4 py-2 rounded-md transition-colors ${data.linkedin_connected === "true" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/80 hover:bg-white/10 border border-transparent"}`}
                >
                  {data.linkedin_connected === "true" ? "Connected" : "Connect"}
                </button>
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-white/50 hover:text-white text-sm transition-colors">Back</button>
              <button
                onClick={() => saveProgress({}, 3)}
                disabled={loading}
                className="bg-white text-black font-medium text-sm py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h1 className="text-2xl font-medium tracking-tight mb-2">Strategic Direction</h1>
              <p className="text-white/40 text-sm">Set your career engine&apos;s operational parameters.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3 block">Growth Priority</label>
                <div className="grid grid-cols-2 gap-3">
                  {['promotion', 'pivot', 'compensation', 'stability'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setData({ ...data, growth_priority: opt })}
                      className={`p-4 rounded-xl border text-left transition-all ${data.growth_priority === opt ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-black hover:border-white/30'}`}
                    >
                      <span className="block text-sm font-medium capitalize">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3 block">Execution Intensity</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'casual', label: 'Casual', desc: '1-2 hrs/wk' },
                    { id: 'balanced', label: 'Balanced', desc: '4-6 hrs/wk' },
                    { id: 'aggressive', label: 'Aggressive', desc: '10+ hrs/wk' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setData({ ...data, execution_intensity: opt.id })}
                      className={`p-3 rounded-xl border text-center transition-all ${data.execution_intensity === opt.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-black hover:border-white/30'}`}
                    >
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className="block text-[10px] text-white/40 mt-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-between items-center mt-4">
              <button onClick={() => setStep(2)} className="text-white/50 hover:text-white text-sm transition-colors">Back</button>
              <button
                onClick={handleFinalize}
                className="bg-blue-600 text-white font-medium text-sm py-2.5 px-6 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                Initialize Systems
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
