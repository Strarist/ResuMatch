'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, FileText, Mail } from 'lucide-react';

const sections = [
  { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'Analysis', href: '/analysis' }] },
  { title: 'Intelligence', links: [{ label: 'Market Data', href: '/market-intelligence' }, { label: 'Trajectory', href: '/trajectory' }, { label: 'Roadmap', href: '/roadmap' }, { label: 'Workspace', href: '/workspace' }] },
  { title: 'Resources', links: [{ label: 'Documentation', href: '#' }, { label: 'API Reference', href: '#' }, { label: 'Security', href: '#' }, { label: 'Status', href: '#' }] },
  { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }, { label: 'Contact', href: '#' }] },
];

export default function FooterV3() {
  return (
    <footer className="border-t border-white/[0.04]" role="contentinfo">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image src="/logo.svg" alt="ResuMatch" width={20} height={20} />
              <span className="font-semibold text-white text-[13px]">ResuMatch</span>
            </Link>
            <p className="text-[11px] text-white/25 leading-relaxed mb-4">AI-powered career intelligence.</p>
            <div className="flex gap-3">
              {[
                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                { icon: FileText, href: '#', label: 'Docs' },
                { icon: Mail, href: 'mailto:support@resumatch.com', label: 'Contact' },
              ].map((s) => (
                <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-white/20 hover:text-white/50 transition-colors duration-200" aria-label={s.label}>
                  <s.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[11px] text-white/25 hover:text-white/50 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-5 border-t border-white/[0.03]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-white/15">© {new Date().getFullYear()} ResuMatch. All rights reserved.</p>
            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Security'].map((item) => (
                <Link key={item} href="#" className="text-[10px] text-white/15 hover:text-white/35 transition-colors duration-200">{item}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
