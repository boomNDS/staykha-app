"use client";

import { Feature } from "@/components/feature";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

export default function HomePage() {
  usePageTitle(
    "Home",
    "StayKha is a comprehensive property management system for dormitories and rental properties. Manage buildings, rooms, tenants, meter readings, and automated billing with multi-admin support, configurable settings, and Thai language invoice support.",
  );

  return (
    <>
      <SEO
        title="Home"
        description="StayKha is a comprehensive property management system for dormitories and rental properties. Manage buildings, rooms, tenants, meter readings, and automated billing with multi-admin support, configurable settings, and Thai language invoice support."
        keywords={[
          "property management",
          "utility billing",
          "meter readings",
          "water billing",
          "electricity billing",
          "tenant management",
          "dormitory management",
          "room management",
          "automated invoicing",
          "multi-admin",
          "Thai invoice",
        ]}
        url={typeof window !== "undefined" ? window.location.origin : ""}
      />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_55%)]">
        <LandingHeader />

        <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
          <LandingHero />

          <Feature />

          <LandingCTA />
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
