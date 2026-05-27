'use client';

import {
  Navbar,
  HeroV2,
  TrustMetrics,
  LogoStrip,
  FeaturesSection,
  MetricsV2Section,
  EcosystemSection,
  CapabilitiesMatrix,
  Testimonials,
  IntelligenceEngine,
  CTAv2Section,
  FooterV3,
} from '@/components/landing';
import { BackgroundLayers } from '@/components/effects';

export default function Home() {
  return (
    <>
      <BackgroundLayers />
      <Navbar />
      <HeroV2 />
      <TrustMetrics />
      <LogoStrip />
      <FeaturesSection />
      <MetricsV2Section />
      <EcosystemSection />
      <CapabilitiesMatrix />
      <Testimonials />
      <IntelligenceEngine />
      <CTAv2Section />
      <FooterV3 />
    </>
  );
}
