'use client';

import { type ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/auth/AuthContext';
import { useLivingSystem } from '@/context/LivingSystemContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map, Radar, Compass, Globe, Award, MessageSquare, FileText, Settings, LogOut, ChevronLeft, Menu, Sparkles, Info, Shield, Activity, GitMerge } from 'lucide-react';
import { Logo } from '@/branding/Logo';

const primaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap-v2', label: 'Roadmap', icon: Map },
  { href: '/opportunities', label: 'Opportunities', icon: Radar },
  { href: '/market-intelligence', label: 'Market Intel', icon: Globe },
  { href: '/workspace', label: 'AI Workspace', icon: MessageSquare },
  { href: '/resumes', label: 'Resumes & Portfolio', icon: FileText },
  { href: '/profile', label: 'Public Profile', icon: Award },
];

const advancedItems = [
  { href: '/predictive', label: 'Predictions', icon: Sparkles },
  { href: '/explainability', label: 'Explainability', icon: Info },
  { href: '/executive', label: 'Strategic Insights', icon: Compass },
];

const developerItems = [
  { href: '/observability', label: 'Observability', icon: Shield },
  { href: '/resilience', label: 'Resilience', icon: Activity },
  { href: '/convergence', label: 'Convergence', icon: GitMerge },
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
        <Logo size={28} showWordmark={!collapsed} className="text-white" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">

        {/* Layer 1: Primary Experience */}
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Primary Experience</p>}
          <div className="space-y-0.5">
            {primaryItems.map((item) => {
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

        {/* Layer 2: Advanced Insights */}
        <div>
          <button
            onClick={() => setAdvancedExpanded(!advancedExpanded)}
            className="flex w-full items-center justify-between px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
          >
            <span>Advanced Insights</span>
            {!collapsed && (
              <motion.span animate={{ rotate: advancedExpanded ? 90 : 0 }} className="text-[8px] text-slate-500">
                ▶
              </motion.span>
            )}
          </button>

          <AnimatePresence initial={false}>
            {(advancedExpanded || collapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-0.5 overflow-hidden"
              >
                {advancedItems.map((item) => {
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layer 3: Developer Diagnostics */}
        {devMode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2 border-t border-rose-500/10">
            {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest">Developer Diagnostics</p>}
            <div className="space-y-0.5">
              {developerItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 relative group border ${
                      isActive
                        ? 'text-rose-200 bg-rose-950/40 border-rose-800/50 shadow-inner font-bold'
                        : 'text-rose-400/80 border-transparent font-semibold hover:text-rose-300 hover:bg-rose-950/20'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    )}
                    <item.icon size={16} className={isActive ? 'text-rose-400' : 'text-rose-600 group-hover:text-rose-500'} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </motion.div>
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

      {/* Strategic Controls */}
      {!collapsed && (
        <div className="px-3 py-2.5 mx-2 mb-2 rounded-lg bg-slate-900/60 border border-white/[0.04] space-y-2.5">
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Persona
            </label>
            <select
              value={activePersona.id}
              onChange={(e) => setActivePersonaId(e.target.value)}
              className="w-full bg-[#080c14] border border-white/[0.08] hover:border-white/[0.18] transition-colors cursor-pointer rounded text-slate-300 text-xs py-1 px-1.5 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="full-stack">Full Stack Engineer</option>
              <option value="cloud-infra">Cloud Engineer</option>
              <option value="backend">Backend Engineer</option>
              <option value="ai-engineer">AI Engineer</option>
              <option value="devops">DevOps Engineer</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Lifecycle State
              </label>
              <button
                onClick={resetLifecycle}
                className="text-[9px] text-red-400 hover:text-red-300 underline font-semibold transition-colors"
              >
                Reset
              </button>
            </div>
            <select
              value={lifecycleStage}
              onChange={(e) => setLifecycleStage(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="w-full bg-[#080c14] border border-white/[0.08] hover:border-white/[0.18] transition-colors cursor-pointer rounded text-slate-300 text-xs py-1 px-1.5 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="1">1: Onboarding</option>
              <option value="2">2: Parsing Portfolio</option>
              <option value="3">3: Calibrated Profile</option>
              <option value="4">4: Optimized Strategy</option>
            </select>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/[0.04] p-3 space-y-1">
        {/* Developer Mode Toggle */}
        <button
          onClick={() => {
            const nextMode = !devMode;
            setDevMode(nextMode);
            localStorage.setItem('dev_mode', nextMode ? 'true' : 'false');
          }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-bold transition-colors ${
            devMode ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.04]' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-500/[0.04]'
          }`}
        >
          <Activity size={16} className={devMode ? 'text-rose-400 animate-pulse' : 'text-slate-500'} />
          {!collapsed && <span>Developer Mode {devMode ? 'On' : 'Off'}</span>}
        </button>

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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
