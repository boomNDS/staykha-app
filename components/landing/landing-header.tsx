"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
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
            ระบบจัดการที่พักครบวงจรสำหรับเจ้าของ
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild variant="outline">
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild>
          <Link to="/overview">
            ไปที่ภาพรวม
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.header>
  );
}
