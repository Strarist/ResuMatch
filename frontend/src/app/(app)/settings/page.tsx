'use client';

import { useAuth } from '@/auth/AuthContext';
import { PageContainer, GlassPanel, SectionLabel, WorkspaceCard, LoadingPulse } from '@/components/workspace';
import { Bell, Shield, Globe, Palette, Database, User } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return <PageContainer title="Settings" subtitle="Customize your experience"><LoadingPulse rows={4} /></PageContainer>;

  const handleToggle = (setting: string) => { toast.info(`${setting} updated`); };

  return (
    <PageContainer title="Settings" subtitle="Customize your ResuMatch experience">
      {/* Profile */}
      <GlassPanel>
        <SectionLabel>Profile</SectionLabel>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center">
            <User size={20} className="text-white/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.email}</p>
            <p className="text-xs text-white/30">Member since {new Date().getFullYear()}</p>
          </div>
        </div>
      </GlassPanel>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Notifications */}
        <WorkspaceCard>
          <div className="flex items-center gap-2 mb-3"><Bell size={14} className="text-blue-400/60" /><SectionLabel>Notifications</SectionLabel></div>
          {['Match alerts', 'Weekly digest', 'Recruiter activity', 'Market updates'].map(item => (
            <div key={item} className="flex items-center justify-between py-2">
              <span className="text-xs text-white/50">{item}</span>
              <button onClick={() => handleToggle(item)} className="w-8 h-4 rounded-full bg-blue-500/30 relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-blue-400" /></button>
            </div>
          ))}
        </WorkspaceCard>

        {/* Security */}
        <WorkspaceCard>
          <div className="flex items-center gap-2 mb-3"><Shield size={14} className="text-emerald-400/60" /><SectionLabel>Security</SectionLabel></div>
          {['Two-factor auth', 'Session management', 'API access', 'Data export'].map(item => (
            <div key={item} className="flex items-center justify-between py-2">
              <span className="text-xs text-white/50">{item}</span>
              <button onClick={() => handleToggle(item)} className="text-[10px] text-blue-400/70 hover:text-blue-400 transition-colors">Configure →</button>
            </div>
          ))}
        </WorkspaceCard>

        {/* Visibility */}
        <WorkspaceCard>
          <div className="flex items-center gap-2 mb-3"><Globe size={14} className="text-violet-400/60" /><SectionLabel>Visibility</SectionLabel></div>
          {['Public profile', 'Recruiter discoverability', 'Skill endorsements', 'Portfolio visibility'].map(item => (
            <div key={item} className="flex items-center justify-between py-2">
              <span className="text-xs text-white/50">{item}</span>
              <button onClick={() => handleToggle(item)} className="w-8 h-4 rounded-full bg-white/[0.1] relative"><div className="absolute left-0.5 top-0.5 w-3 h-3 rounded-full bg-white/30" /></button>
            </div>
          ))}
        </WorkspaceCard>

        {/* Preferences */}
        <WorkspaceCard>
          <div className="flex items-center gap-2 mb-3"><Palette size={14} className="text-amber-400/60" /><SectionLabel>Preferences</SectionLabel></div>
          {['Dark mode', 'Reduced motion', 'Compact view', 'Auto-analysis'].map(item => (
            <div key={item} className="flex items-center justify-between py-2">
              <span className="text-xs text-white/50">{item}</span>
              <button onClick={() => handleToggle(item)} className="w-8 h-4 rounded-full bg-blue-500/30 relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-blue-400" /></button>
            </div>
          ))}
        </WorkspaceCard>
      </div>

      {/* Data */}
      <WorkspaceCard>
        <div className="flex items-center gap-2 mb-3"><Database size={14} className="text-cyan-400/60" /><SectionLabel>Data Management</SectionLabel></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => toast.info('Export started')} className="px-3 py-1.5 text-xs text-white/50 border border-white/[0.08] rounded-lg hover:bg-white/[0.03] transition-colors">Export Data</button>
          <button onClick={() => toast.info('Cache cleared')} className="px-3 py-1.5 text-xs text-white/50 border border-white/[0.08] rounded-lg hover:bg-white/[0.03] transition-colors">Clear Cache</button>
          <button className="px-3 py-1.5 text-xs text-red-400/60 border border-red-400/10 rounded-lg hover:bg-red-500/[0.04] transition-colors">Delete Account</button>
        </div>
      </WorkspaceCard>
    </PageContainer>
  );
}
