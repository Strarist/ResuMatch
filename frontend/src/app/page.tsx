'use client';

import {
  Navbar,
  HeroV2,
  TrustMetrics,
  LogoStrip,
  ProblemSolutionSection,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  FAQSection,
  Testimonials,
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
      <ProblemSolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <Testimonials />
      <CTAv2Section />
      <FooterV3 />
    </>
  );
}
