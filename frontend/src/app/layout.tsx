import './globals.css';

import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider } from '@/auth/ThemeContext';
import { Toaster } from 'react-hot-toast';
import SessionManager from '@/components/SessionManager';
import { IntelligenceProviders } from '@/components/providers/IntelligenceProviders';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ResuMatch — Distributed Cognition Workspace',
  description: 'Adaptive career intelligence operating system.',
};

export const viewport: Viewport = {
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <IntelligenceProviders>
              <SessionManager />
              {children}
              <Toaster position="bottom-right" />
            </IntelligenceProviders>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
