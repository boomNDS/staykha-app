"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Typewriter } from "@/components/typewriter";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function LandingHero() {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
      }}
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
          className="font-heading text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl min-h-[3.5rem] sm:min-h-[4rem]"
        >
          <Typewriter
            text={[
              "Property management made simple.",
              "Automated billing workflows.",
              "Multi-admin collaboration.",
            ]}
            speed={50}
            initialDelay={500}
            waitTime={3000}
            deleteSpeed={30}
            loop={true}
            className="block"
            showCursor={true}
            cursorChar="|"
            cursorClassName="ml-1 text-primary"
          />
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-pretty text-base text-muted-foreground sm:text-lg"
        >
          Manage buildings, tenants, meter readings, and billing in one
          streamlined workflow.
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
  );
}
