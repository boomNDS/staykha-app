"use client";

import { Features } from "@/components/feature";
import { CookieConsent } from "@/components/cookie-consent";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingProblems } from "@/components/landing/landing-problems";
import { LandingProof } from "@/components/landing/landing-proof";
import { LandingSocialProof } from "@/components/landing/landing-social-proof";
import { LandingWaitlist } from "@/components/landing/landing-waitlist";
import { LandingWorkflow } from "@/components/landing/landing-workflow";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

export default function HomePage() {
  usePageTitle(
    "หน้าแรก",
    "StayKha คือระบบบริหารจัดการที่พักสำหรับหอพักและบ้านเช่า รวมการจัดการอาคาร ห้องพัก ผู้เช่า การอ่านมิเตอร์ และการออกบิลอัตโนมัติในเวิร์กโฟลว์เดียว รองรับหลายผู้ดูแลและปรับแต่งได้ พร้อมใบแจ้งหนี้ภาษาไทย | StayKha is a property management system for rentals, covering buildings, rooms, tenants, meter readings, and automated billing in one workflow.",
  );

  return (
    <>
      <SEO
        title="หน้าแรก"
        description="StayKha คือระบบบริหารจัดการที่พักสำหรับหอพักและบ้านเช่า รวมการจัดการอาคาร ห้องพัก ผู้เช่า การอ่านมิเตอร์ และการออกบิลอัตโนมัติในเวิร์กโฟลว์เดียว รองรับหลายผู้ดูแลและปรับแต่งได้ พร้อมใบแจ้งหนี้ภาษาไทย | StayKha is a property management system for rentals, covering buildings, rooms, tenants, meter readings, and automated billing in one workflow."
        keywords={[
          "ระบบบริหารที่พัก",
          "ออกบิลค่าน้ำไฟ",
          "อ่านมิเตอร์",
          "ค่าน้ำ",
          "ค่าไฟ",
          "จัดการผู้เช่า",
          "จัดการหอพัก",
          "จัดการห้องพัก",
          "ระบบจัดการหอพัก",
          "ระบบจัดการบ้านเช่า",
          "ใบแจ้งหนี้อัตโนมัติ",
          "หลายผู้ดูแล",
          "ใบแจ้งหนี้ภาษาไทย",
          "property management",
          "rental management",
          "dormitory management",
          "apartment management",
          "tenant management",
          "meter reading",
          "utility billing",
          "invoice automation",
        ]}
        url={typeof window !== "undefined" ? window.location.origin : ""}
      />
      <div className="relative min-h-screen overflow-hidden bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.08),_transparent_50%)]"
        />
        <a
          href="#main"
          className="sr-only z-30 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg focus:not-sr-only focus:absolute focus:left-6 focus:top-6"
        >
          ข้ามไปยังเนื้อหา
        </a>
        <LandingHeader />

        <main
          id="main"
          className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-28 pt-14 sm:pt-20"
        >
          <LandingHero />

          <LandingSocialProof />

          <LandingProof />

          <LandingProblems />

          <Features />

          <LandingWorkflow />

          <LandingWaitlist />
        </main>

        <LandingFooter />
        <CookieConsent />
      </div>
    </>
  );
}
