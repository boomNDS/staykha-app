"use client";

import { Features } from "@/components/feature";
import { CookieConsent } from "@/components/cookie-consent";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_55%)]">
        <LandingHeader />

        <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
          <LandingHero />

          <Features />

          <LandingCTA />
        </main>

        <LandingFooter />
        <CookieConsent />
      </div>
    </>
  );
}
