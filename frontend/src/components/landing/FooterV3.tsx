'use client';

import Link from 'next/link';
import { Github, FileText, Mail } from 'lucide-react';
import { ClickableLogo } from '@/components/common/ClickableLogo';

const sections = [
  { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'How It Works', href: '#how-it-works' }, { label: 'Pricing', href: '#pricing' }, { label: 'About', href: '#about' }] },
  { title: 'Platform', links: [{ label: 'Sign In', href: '/login' }, { label: 'Register', href: '/signup' }, { label: 'Candidate Dashboard', href: '/dashboard' }, { label: 'Resume Analyzer', href: '/resumes' }] },
  { title: 'Resources', links: [{ label: 'Guides & Documentation', href: '#' }, { label: 'Security & Sanitization', href: '#' }, { label: 'Platform Status', href: '#' }] },
  { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Privacy Policy', href: '#' }, { label: 'Terms of Service', href: '#' }, { label: 'Contact Support', href: '#' }] },
];

export default function FooterV3() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#020617]" role="contentinfo">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <ClickableLogo size={28} showWordmark={true} className="text-white" />
            </Link>
            <p className="text-[13px] text-white/40 leading-relaxed">AI-powered technical career growth and alignment.</p>
            <div className="flex gap-4 pt-2">
              {[
                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                { icon: FileText, href: '#', label: 'Docs' },
                { icon: Mail, href: 'mailto:support@skillyn.com', label: 'Contact' },
              ].map((s) => (
                <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors duration-200" aria-label={s.label}>
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections (Larger, more readable text sizes) */}
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-[12px] font-bold text-white/50 uppercase tracking-widest">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-white/[0.03]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-white/20">© {new Date().getFullYear()} Skillyn. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Security Standards'].map((item) => (
                <Link key={item} href="#" className="text-[12px] text-white/20 hover:text-white/40 transition-colors duration-200">{item}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
