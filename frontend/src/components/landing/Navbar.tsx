'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Layout } from '@/components/layout/LayoutSystem';
import { ClickableLogo } from '@/components/common/ClickableLogo';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Active section highlighting
      const scrollPosition = window.scrollY + 120; // offsets navbar height
      const sections = ['features', 'how-it-works', 'pricing', 'about'];

      let currentSection = '';
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = sectionId;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial trigger
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 88; // fixed navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setOpen(false); // close mobile menu if open
    }
  };

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
            <ClickableLogo size={34} showWordmark={true} className="text-white" />
          </Link>
        </div>

        {/* Center Links (Slightly larger font size for premium SaaS styling) */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => handleScrollTo(e, l.href)}
              className={`text-[14px] font-semibold tracking-wide transition-colors duration-200 ${
                activeSection === l.href.substring(1)
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Action buttons (SaaS-style: Login / Get Started) */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-[14px] font-semibold tracking-wide text-slate-300 hover:text-white transition-colors duration-200">
            Login
          </Link>
          <Link href="/signup" className="px-6 py-2.5 text-[14px] font-bold tracking-wide text-black bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all duration-200 shadow-lg">
            Get Started
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
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-4 block">Navigation</span>
                <div className="space-y-1">
                  {links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      onClick={(e) => handleScrollTo(e, l.href)}
                      className={`block py-3 text-[15px] font-semibold transition-colors ${
                        activeSection === l.href.substring(1)
                          ? 'text-emerald-400 font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" onClick={() => setOpen(false)} className="w-full text-center py-3 text-[14px] font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors rounded-lg">
                  Login
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="w-full text-center py-3 text-[14px] font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all rounded-lg">
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
