'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Brain, BarChart3, TrendingUp, Map, Radar, Compass, UserCheck, Globe, Award, MessageSquare, Upload, FileText, Settings, LogOut, ChevronLeft, Menu, Sparkles, Info, Shield, Activity, GitMerge } from 'lucide-react';
import { Logo } from '@/branding/Logo';

const navGroups = [
  {
    label: 'Intelligence Orchestration',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/intelligence', label: 'Intelligence', icon: Brain },
      { href: '/predictive', label: 'Predictive', icon: Sparkles },
      { href: '/explainability', label: 'Explainability', icon: Info },
      { href: '/executive', label: 'Executive', icon: BarChart3 },
      { href: '/observability', label: 'Observability', icon: Shield },
      { href: '/resilience', label: 'Resilience', icon: Activity },
      { href: '/convergence', label: 'Convergence', icon: GitMerge },
      { href: '/progress', label: 'Progress', icon: TrendingUp },
    ],
  },
  {
    label: 'Execution Infrastructure',
    items: [
      { href: '/roadmap-v2', label: 'Roadmap', icon: Map },
      { href: '/opportunities', label: 'Opportunities', icon: Radar },
      { href: '/trajectory', label: 'Trajectory', icon: Compass },
      { href: '/market-intelligence', label: 'Market Intel', icon: Globe },
    ],
  },
  {
    label: 'Recruiter Integration',
    items: [
      { href: '/recruiter-intelligence', label: 'Recruiter Intel', icon: UserCheck },
      { href: '/profile', label: 'Public Profile', icon: Award },
    ],
  },
  {
    label: 'System Control',
    items: [
      { href: '/workspace', label: 'AI Workspace', icon: MessageSquare },
      { href: '/upload', label: 'Upload', icon: Upload },
      { href: '/resumes', label: 'Resumes', icon: FileText },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout, isOffline } = useAuth();

  const sidebar = (
    <aside className={`flex flex-col h-full border-r border-white/[0.04] bg-[#080c14]/90 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/[0.04]">
        <Logo size={28} showWordmark={!collapsed} className="text-white" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 relative group ${
                      isActive
                        ? 'text-white bg-slate-800/80 font-bold border border-slate-700/50 shadow-inner'
                        : 'text-slate-400 font-semibold hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    {isActive && (
                      <motion.div layoutId="nav-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" transition={{ duration: 0.25 }} />
                    )}
                    <item.icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Offline Status */}
      {isOffline && !collapsed && (
        <div className="px-3 py-2.5 mx-2 mb-3 rounded-lg bg-slate-900/80 border border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Local Mode</span>
          </div>
          <p className="text-[10px] font-medium text-amber-500/70 leading-tight">Backend is currently offline.</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/[0.04] p-3 space-y-1">
        <button onClick={() => logout()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/[0.04] transition-colors">
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="flex w-full items-center justify-center rounded-lg py-2 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ duration: 0.25 }} className="fixed left-0 top-0 bottom-0 z-50 md:hidden w-64">
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center px-4 border-b border-slate-800 bg-[#020617]/90 backdrop-blur-xl md:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-400 hover:text-white" aria-label="Open menu">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-5 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
