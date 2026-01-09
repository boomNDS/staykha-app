"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Camera,
  Clock,
  FileText,
  Gauge,
  Settings,
  Sparkles,
  Users,
  UserPlus,
} from "lucide-react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Button } from "@/components/ui/button";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

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
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <StayKhaLogo className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
                StayKha
              </p>
              <p className="text-xs text-muted-foreground">
                Owner operations suite
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/overview">
                Go to Overview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.header>

        <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
          >
            <motion.div variants={fadeUp} className="space-y-6">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Built for owner workflows
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="font-heading text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl"
              >
                Complete property management for dormitories and rentals.
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-pretty text-base text-muted-foreground sm:text-lg"
              >
                StayKha helps property owners manage buildings, rooms, tenants,
                and utility billing. Track meter readings with photo uploads,
                generate automated invoices, and collaborate with your team—all
                in one streamlined workflow.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/login">
                    Start managing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/overview">View demo overview</Link>
                </Button>
              </motion.div>
              <motion.div
                variants={fadeUp}
                className="flex flex-wrap gap-6 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Buildings & rooms organized by floor
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Complete tenant profiles & contracts
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  Water + electric readings with photos
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Automated invoices & PDF export
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Multi-admin with role-based access
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Configurable rates & Thai labels
                </div>
              </motion.div>
              <motion.div
                variants={fadeUp}
                className="grid gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground sm:grid-cols-3"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  10-minute monthly closeout
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  Photo uploads for readings
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Bulk room creation & batch print
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-2xl backdrop-blur"
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Monthly snapshot
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    ฿48,320 collected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    12 invoices paid • 3 pending
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Occupancy
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      48 / 52
                    </p>
                    <p className="text-xs text-muted-foreground">92% full</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Readings
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      52 rooms
                    </p>
                    <p className="text-xs text-muted-foreground">
                      4 missing meters
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
                  Track utilities in one pass, and auto-build invoices for every
                  room.
                </div>
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mt-16 rounded-3xl border border-primary/20 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(56,189,248,0.12))] p-8"
          >
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                  Get started fast
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  Ready to streamline your property operations?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Manage buildings, tenants, meter readings, and billing with
                  automated workflows, multi-admin support, and customizable
                  settings—all designed for property owners.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/login">
                    Create your first property
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/overview/billing">See billing workflow</Link>
                </Button>
              </div>
            </motion.div>
          </motion.section>
        </main>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-border/60 bg-background/80 backdrop-blur"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <StayKhaLogo className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
                      StayKha
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Owner operations suite
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete property management for dormitories and rentals.
                  Manage buildings, tenants, meter readings, and billing with
                  multi-admin support and automated workflows.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Account
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link
                      to="/login"
                      className="hover:text-foreground transition-colors"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="hover:text-foreground transition-colors"
                    >
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/forgot-password"
                      className="hover:text-foreground transition-colors"
                    >
                      Reset Password
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link
                      to="/terms"
                      className="hover:text-foreground transition-colors"
                    >
                      Terms & Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-border/60 pt-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} StayKha. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <Link
                    to="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                  <span>•</span>
                  <Link
                    to="/terms"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
