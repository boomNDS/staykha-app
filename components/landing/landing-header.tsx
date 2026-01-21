"use client";

import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "features", label: "ฟีเจอร์" },
  { id: "workflow", label: "เวิร์กโฟลว์" },
  { id: "waitlist", label: "ทดลองใช้งาน" },
];

export function LandingHeader() {
  const shouldReduceMotion = useReducedMotion();
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0.8, 1]);
  const headerBlur = useTransform(scrollY, [0, 100], [8, 12]);

  useEffect(() => {
    if (!sections.length) return undefined;

    const observers = sections
      .map((section) => {
        const target = document.getElementById(section.id);
        if (!target) return null;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setActiveSection(section.id);
            }
          },
          { rootMargin: "-35% 0px -55% 0px", threshold: 0.1 },
        );

        observer.observe(target);
        return observer;
      })
      .filter(Boolean) as IntersectionObserver[];

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <motion.header
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
      style={{ 
        opacity: shouldReduceMotion ? 1 : headerOpacity,
        backdropFilter: shouldReduceMotion ? undefined : `blur(${headerBlur}px)`,
      }}
      className="sticky top-4 z-20 mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-6 py-4 shadow-lg backdrop-blur transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white shadow-sm">
          <StayKhaLogo className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
            StayKha
          </p>
          <p className="text-xs text-slate-600">
            ระบบจัดการที่พักครบวงจรสำหรับเจ้าของ
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={activeSection === section.id ? "true" : undefined}
              className="relative transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[active=true]:text-slate-900"
              data-active={activeSection === section.id}
            >
              {section.label}
              <span
                data-active={activeSection === section.id}
                className="pointer-events-none absolute -bottom-2 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-slate-700 transition-transform duration-200 data-[active=true]:scale-x-100"
              />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-slate-200 bg-white/70 text-slate-700 hover:bg-white">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-slate-900 text-white hover:bg-slate-900/90">
            <Link to="/overview">
              ไปที่ภาพรวม
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
