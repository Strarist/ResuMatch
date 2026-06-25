import './globals.css';

import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider } from '@/auth/ThemeContext';
import { Toaster } from 'sonner';
import SessionManager from '@/components/SessionManager';
import { IntelligenceProviders } from '@/components/providers/IntelligenceProviders';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Skillyn — From Resume to Career Growth',
  description: 'AI-powered career growth platform that transforms resumes into personalized roadmaps, opportunities, market insights, and career coaching.',
  applicationName: 'Skillyn',
  metadataBase: new URL('https://skillyn.com'),
  openGraph: {
    title: 'Skillyn — From Resume to Career Growth',
    description: 'AI-powered career growth platform that transforms resumes into personalized roadmaps, opportunities, market insights, and career coaching.',
    url: 'https://skillyn.com',
    siteName: 'Skillyn',
    images: [
      {
        url: '/logo.svg',
        width: 800,
        height: 600,
        alt: 'Skillyn Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skillyn — From Resume to Career Growth',
    description: 'AI-powered career growth platform that transforms resumes into personalized roadmaps, opportunities, market insights, and career coaching.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
