"use client";

import React, { useEffect, useState } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { StrategicStateBanner } from '@/components/dashboard/StrategicStateBanner';
import { IntelligenceMutationFeed } from '@/components/dashboard/IntelligenceMutationFeed';
import { AdaptiveInfluenceGraph } from '@/components/dashboard/AdaptiveInfluenceGraph';
import { LongitudinalTimeline } from '@/components/timeline/LongitudinalTimeline';
import { Brain, Upload } from 'lucide-react';
import PremiumButton from '@/components/ui/PremiumButton';
import { Layout } from '@/components/layout/LayoutSystem';

export default function DashboardPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumes = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/resumes`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setResumes(data || []);
      } catch (err) {
        console.error("Failed to fetch resumes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  if (loading) return <div className="p-8 text-white/50">Loading intelligence...</div>;

  // Empty State - Awaiting Hydration (simulated)
  if (resumes.length === 0) {
    return (
      <Layout variant="dashboard">
        <PageContainer
          title="Dashboard"
          subtitle="Strategic Control Center"
          actions={
            <PremiumButton href="/upload" variant="primary">
              <Upload size={14} className="mr-2" /> Upload Portfolio
            </PremiumButton>
          }
        >
        <div className="mb-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4 animate-fade-in">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Brain size={20} className="text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white mb-1">Baseline Intelligence Initialized</h3>
            <p className="text-xs text-white/50">Your onboarding profile has seeded the intelligence engine. Upload a resume to replace these simulations with real structural analysis.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 pointer-events-none">
          <div className="lg:col-span-3">
            <StrategicStateBanner />
          </div>

          <div className="lg:col-span-2">
            <AdaptiveInfluenceGraph />
          </div>

          <div className="lg:col-span-1 h-[400px]">
            <IntelligenceMutationFeed />
          </div>
        </div>
        </PageContainer>
      </Layout>
    );
  }

  // Active Intelligence State
  return (
    <Layout variant="dashboard">
      <PageContainer
        title="Dashboard"
        subtitle="Strategic Control Center"
        actions={
          <PremiumButton href="/executive-intelligence" variant="secondary">
            Executive Mode
          </PremiumButton>
        }
      >
      <div className="space-y-6">
        {/* TOP LAYER - Strategic State */}
        <section className="animate-fade-in">
          <StrategicStateBanner />
        </section>

        {/* SECOND LAYER - Influence Graph & Mutation Feed */}
        <section className="grid lg:grid-cols-3 gap-6 animate-slide-in-bottom" style={{ animationDelay: '0.1s' }}>
          <div className="lg:col-span-2">
            <AdaptiveInfluenceGraph />
          </div>
          <div className="lg:col-span-1 h-[400px]">
            <IntelligenceMutationFeed />
          </div>
        </section>

        {/* THIRD LAYER - Longitudinal Timeline */}
        <section className="animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
          <LongitudinalTimeline />
        </section>
      </div>
      </PageContainer>
    </Layout>
  );
}
