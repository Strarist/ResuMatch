'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, FileText, Mail } from 'lucide-react';

const footerSections = [
  { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'Resume', href: '/resumes' }] },
  { title: 'Intelligence', links: [{ label: 'Market Data', href: '/market-intelligence' }, { label: 'Career Trajectory', href: '/trajectory' }, { label: 'Roadmap', href: '/roadmap-v2' }] },
  { title: 'Recruiters', links: [{ label: 'Recruiter Intel', href: '/recruiter-intelligence' }, { label: 'Opportunity Radar', href: '/opportunities' }] },
  { title: 'Resources', links: [{ label: 'Documentation', href: '#' }, { label: 'API Reference', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Changelog', href: '#' }] },
  { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }, { label: 'Contact', href: '#' }] },
];

export default function FooterV2() {
  return (
    <footer className="border-t border-white/[0.06] mt-16" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="Skillyn" width={24} height={24} />
              <span className="font-semibold text-white text-sm">Skillyn</span>
            </Link>
            <p className="text-xs text-white/30 leading-relaxed mb-4">
              AI-powered career intelligence platform.
            </p>
            <div className="flex gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition-colors" aria-label="GitHub">
                <Github size={16} />
              </a>
              <a href="#" className="text-white/30 hover:text-white/60 transition-colors" aria-label="Documentation">
                <FileText size={16} />
              </a>
              <a href="mailto:support@skillyn.com" className="text-white/30 hover:text-white/60 transition-colors" aria-label="Contact">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-xs text-white/30 hover:text-white/60 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/20">© {new Date().getFullYear()} Skillyn. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Privacy</Link>
            <Link href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Terms</Link>
            <Link href="#" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
