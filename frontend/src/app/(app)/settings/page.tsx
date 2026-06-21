/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { PageContainer, GlassPanel, SectionLabel, WorkspaceCard, LoadingPulse } from '@/components/workspace';
import { Bell, Palette, Database, User, LogOut, ShieldCheck, Sun } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Local settings states (saved to localStorage)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [recruiterActivity, setRecruiterActivity] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const [resumeAutoAnalysis, setResumeAutoAnalysis] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Hydrate settings states from localStorage on boot
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('email_alerts');
      if (savedEmail !== null) setEmailAlerts(savedEmail === 'true');

      const savedRecruiter = localStorage.getItem('recruiter_alerts');
      if (savedRecruiter !== null) setRecruiterActivity(savedRecruiter === 'true');

      const savedDigest = localStorage.getItem('digest_alerts');
      if (savedDigest !== null) setWeeklyDigest(savedDigest === 'true');

      const savedAuto = localStorage.getItem('resume_auto_analysis');
      if (savedAuto !== null) setResumeAutoAnalysis(savedAuto === 'true');

      const savedVisible = localStorage.getItem('profile_visibility');
      if (savedVisible !== null) setProfileVisibility(savedVisible === 'true');
    }
  }, []);

  if (!user) {
    return (
      <PageContainer title="Settings" subtitle="Customize your experience">
        <LoadingPulse rows={4} />
      </PageContainer>
    );
  }

  // Handle preference changes and persist them to localStorage
  const updateSetting = (key: string, value: boolean, setter: (v: boolean) => void, friendlyName: string) => {
    setter(value);
    localStorage.setItem(key, String(value));
    toast.success(`${friendlyName} preference updated successfully`);
  };

  const handleClearCache = () => {
    localStorage.removeItem('resume_auto_analysis');
    localStorage.removeItem('profile_visibility');
    localStorage.removeItem('email_alerts');
    localStorage.removeItem('recruiter_alerts');
    localStorage.removeItem('digest_alerts');

    // Reset local states
    setResumeAutoAnalysis(true);
    setProfileVisibility(true);
    setEmailAlerts(true);
    setRecruiterActivity(true);
    setWeeklyDigest(false);

    toast.success("Offline storage cache cleared successfully.");
  };

  return (
    <PageContainer title="Settings" subtitle="Manage your profile settings and customize your upskilling preferences">
      <div className="space-y-6 animate-fade-in">

        {/* Account profile info */}
        <GlassPanel className="p-5 flex items-center justify-between flex-wrap gap-4 border border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-white/40">
              <User size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user.email}</p>
              <p className="text-xs text-slate-500">Account status: <span className="text-emerald-400 font-semibold">Active Profile</span></p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              toast.info("Logging out...");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/[0.04] text-xs font-bold text-red-400 transition-all"
          >
            <LogOut size={14} /> Log Out
          </button>
        </GlassPanel>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Notifications workspace panel */}
          <WorkspaceCard className="border border-white/[0.04] bg-white/[0.01]">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={14} className="text-blue-400/60" />
              <SectionLabel>Notification Preferences</SectionLabel>
            </div>

            <div className="space-y-4">
              {/* Option 1: Email Alerts */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0 pb-3">
                <div>
                  <span className="text-xs text-white/80 font-medium block">Email Matching Alerts</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Receive immediate notifications on tailored job match detections</span>
                </div>
                <button
                  onClick={() => updateSetting('email_alerts', !emailAlerts, setEmailAlerts, 'Email alerts')}
                  className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                    emailAlerts ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${emailAlerts ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Option 2: Recruiter Activity */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0 pb-3">
                <div>
                  <span className="text-xs text-white/80 font-medium block">Recruiter Profile Views</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Alert me when headhunters inspect my credentials or skills scorecards</span>
                </div>
                <button
                  onClick={() => updateSetting('recruiter_alerts', !recruiterActivity, setRecruiterActivity, 'Recruiter activity')}
                  className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                    recruiterActivity ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${recruiterActivity ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Option 3: Weekly Digest */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs text-white/80 font-medium block">Weekly Roadmap Summary</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Get a weekly email digest of completed sprint milestones and progress</span>
                </div>
                <button
                  onClick={() => updateSetting('digest_alerts', !weeklyDigest, setWeeklyDigest, 'Weekly digest')}
                  className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                    weeklyDigest ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${weeklyDigest ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </WorkspaceCard>

          {/* Preferences panel */}
          <WorkspaceCard className="border border-white/[0.04] bg-white/[0.01]">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={14} className="text-amber-400/60" />
              <SectionLabel>upskilling Preferences</SectionLabel>
            </div>

            <div className="space-y-4">
              {/* Theme Settings: Dark Mode */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0 pb-3">
                <div>
                  <span className="text-xs text-white/80 font-medium block">Premium Dark Mode Theme</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Optimize dashboard visibility for night upskilling. Enforced by default.</span>
                </div>
                <button
                  onClick={() => toast.info("Premium Dark Theme is optimized by default.")}
                  className="w-8 h-4.5 rounded-full bg-emerald-500 relative flex items-center p-0.5 cursor-not-allowed"
                  disabled
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-black translate-x-3.5" />
                </button>
              </div>

              {/* Resume Auto-Analysis */}
              <div className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0 pb-3">
                <div>
                  <span className="text-xs text-white/80 font-medium block">Resume Auto-Analysis</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Automatically recalibrate career trajectories immediately upon uploading new resumes</span>
                </div>
                <button
                  onClick={() => updateSetting('resume_auto_analysis', !resumeAutoAnalysis, setResumeAutoAnalysis, 'Auto-Analysis')}
                  className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                    resumeAutoAnalysis ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${resumeAutoAnalysis ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Profile Visibility */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs text-white/80 font-medium block">Public Profile Visibility</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Enable public URL link sharing of verified upskilling badges and skills credentials</span>
                </div>
                <button
                  onClick={() => updateSetting('profile_visibility', !profileVisibility, setProfileVisibility, 'Public profile')}
                  className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                    profileVisibility ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform ${profileVisibility ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </WorkspaceCard>
        </div>

        {/* Data & Cache Management panel */}
        <WorkspaceCard className="border border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-4">
            <Database size={14} className="text-cyan-400/60" />
            <SectionLabel>Offline Storage & Data Control</SectionLabel>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              Skillyn caches your customized layout templates and settings preferences in your local browser sandbox to guarantee high-performance loads. Wiping this cache resets local preferences.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleClearCache}
                className="px-4 py-2 text-xs font-semibold text-white/70 border border-white/[0.08] rounded-lg hover:bg-white/[0.03] transition-all"
              >
                Reset Local Preferences
              </button>
              <button
                onClick={() => toast.error("Public databases accounts can only be deleted via administrator portals.")}
                className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/10 hover:bg-red-500/[0.04] rounded-lg transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        </WorkspaceCard>
      </div>
    </PageContainer>
  );
}
