"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function LandingCTA() {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
      }}
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
  );
}
