'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { Layout } from '@/components/layout/LayoutSystem';
import { Logo } from '@/branding/Logo';

const links = [
  { label: 'Platform', href: '#features' },
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Recruiters', href: '#recruiters' },
  { label: 'Execution', href: '#execution' },
  { label: 'Enterprise', href: '#enterprise' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isOffline } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#020617]/95 backdrop-blur-2xl border-b border-slate-800 shadow-xl shadow-black/20'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <Layout variant="ultra" className="h-[88px] flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={32} showWordmark={true} className="text-white" />
          </Link>

          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-400'} ${!isOffline && 'animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`} />
            <span className={`text-[11px] font-bold tracking-widest uppercase ${isOffline ? 'text-amber-500/90' : 'text-slate-300'}`}>
              {isOffline ? 'Local UI Mode' : 'Live Runtime'}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[13px] font-bold tracking-widest uppercase text-slate-400 hover:text-white transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-[12px] font-bold tracking-widest uppercase text-slate-400 hover:text-white transition-colors duration-200">
            System Login
          </Link>
          <Link href="/signup" className="px-5 py-2.5 text-[12px] font-extrabold tracking-widest uppercase text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(0,0,0,0.5)]">
            Initialize Systems
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-400 hover:text-white" aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Layout>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-[#020617] border-b border-slate-800 shadow-2xl"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="mb-4 pb-4 border-b border-slate-800">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4 block">Navigation Systems</span>
                <div className="space-y-1">
                  {links.map((l) => (
                    <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-[14px] font-bold tracking-wider uppercase text-slate-300 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" onClick={() => setOpen(false)} className="w-full text-center py-3.5 text-[12px] font-bold tracking-widest uppercase text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
                  System Login
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="w-full text-center py-3.5 text-[12px] font-extrabold tracking-widest uppercase text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  Initialize Infrastructure
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
