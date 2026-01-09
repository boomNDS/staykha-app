"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { StayKhaLogo } from "@/components/staykha-logo";

export function LandingFooter() {
  return (
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
              Complete property management for dormitories and rentals. Manage
              buildings, tenants, meter readings, and billing with multi-admin
              support and automated workflows.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Account</h3>
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
  );
}
