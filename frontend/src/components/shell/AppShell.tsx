/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Map, Radar, Compass, Globe, Award, MessageSquare, FileText, Settings, LogOut, ChevronLeft, Menu, Sparkles, Info, Shield, Activity, GitMerge } from 'lucide-react';
import { ClickableLogo } from '@/components/common/ClickableLogo';
import { SimulationBanner } from '@/components/shell/SimulationBanner';
import { devOnlyNavItems } from '@/lib/dev-mode';
import { env } from '@/lib/env';

const coreItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap-v2', label: 'Roadmap', icon: Map },
  { href: '/opportunities', label: 'Opportunities', icon: Radar },
  { href: '/workspace', label: 'AI Coach', icon: MessageSquare },
  { href: '/resumes', label: 'Resume', icon: FileText },
  { href: '/profile', label: 'Profile', icon: Award },
];

const secondaryItems = [
  { href: '/market-intelligence', label: 'Market Insights', icon: Globe },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const pathname = usePathname();
  const { logout, isOffline } = useAuth();
  const {
    activePersona,
    lifecycleStage,
    setLifecycleStage,
    setActivePersonaId,
    resetLifecycle
  } = useLivingSystem();

  useEffect(() => {
    if (env.NEXT_PUBLIC_DEV_MODE) {
      setDevMode(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true') {
      localStorage.setItem('dev_mode', 'true');
      setDevMode(true);
    } else {
      const stored = localStorage.getItem('dev_mode');
      if (stored === 'true') {
        setDevMode(true);
      }
    }
  }, []);

  const sidebar = (
    <aside className={`flex flex-col h-full border-r border-white/[0.04] bg-[#080c14]/90 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/[0.04]">
        <Link href="/dashboard" className="inline-flex">
          <ClickableLogo size={28} showWordmark={!collapsed} className="text-white" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">

        {/* Core Items */}
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Core</p>}
          <div className="space-y-0.5">
            {coreItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 relative group ${
                    isActive
                      ? 'text-white bg-slate-800/85 font-bold border border-slate-700/50 shadow-inner'
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

        {/* Secondary Items */}
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secondary</p>}
          <div className="space-y-0.5">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 relative group ${
                    isActive
                      ? 'text-white bg-slate-800/85 font-bold border border-slate-700/50 shadow-inner'
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

        {devMode && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">
                Dev / Research
              </p>
            )}
            <div className="space-y-0.5">
              {devOnlyNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 ${
                      isActive
                        ? 'text-amber-200 bg-amber-500/10 font-bold border border-amber-500/20'
                        : 'text-slate-500 font-semibold hover:text-amber-200/80 hover:bg-amber-500/5'
                    }`}
                  >
                    <Sparkles size={16} className={isActive ? 'text-amber-400' : 'text-slate-600'} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

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
        {/* Settings button */}
        <Link
          href="/settings"
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${
            pathname === '/settings' ? 'text-white bg-slate-800/80 font-bold border border-slate-700/50 shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <Settings size={16} className={pathname === '/settings' ? 'text-emerald-400' : 'text-slate-500'} />
          {!collapsed && <span>Settings</span>}
        </Link>

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
            <SimulationBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
