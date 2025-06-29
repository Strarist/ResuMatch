import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/auth/AuthContext';
import { ThemeProvider } from '@/auth/ThemeContext';
import { Toaster } from 'react-hot-toast';
import PageTransition from '@/components/PageTransition';
import SessionManager from '@/components/SessionManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ResuMatch',
  description: 'AI-powered resume matcher for recruiters and job seekers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4 py-6`}> 
        <ThemeProvider>
          <AuthProvider>
            <SessionManager />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 max-w-5xl w-full mx-auto flex flex-col justify-center items-center">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
            <Toaster position="top-center" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
