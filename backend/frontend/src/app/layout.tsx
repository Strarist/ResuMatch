import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import FabUpload from "@/components/FabUpload";
import { AuthProvider } from "@/auth/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResuMatch - AI-Powered Resume Matcher",
  description: "Match your resume with job descriptions using advanced AI technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <AuthProvider>
          <PageTransition>
            <Navbar />
            <div className="animated-bg" />
            <div className="min-h-screen bg-grid-white/[0.02] relative">
              <div className="relative z-10">
                {children}
              </div>
              <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-slate-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            </div>
            <FabUpload />
          </PageTransition>
          <Toaster position="top-center" toastOptions={{
            style: { background: '#22223b', color: '#fff', borderRadius: '0.75rem', fontWeight: 500 },
            success: { style: { background: '#2a9d8f' } },
            error: { style: { background: '#e63946' } },
          }} />
        </AuthProvider>
      </body>
    </html>
  );
}
