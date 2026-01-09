"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/lib/use-page-title";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function TermsPage() {
  usePageTitle("Terms & Privacy Policy");

  return (
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
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </motion.header>

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 pt-10">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
          className="space-y-8"
        >
          <motion.div variants={fadeUp} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Terms of Service & Privacy Policy
                </h1>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur"
          >
            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  1. Terms of Service
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    By accessing and using StayKha, you accept and agree to be
                    bound by the terms and provision of this agreement.
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    1.1 Use License
                  </h3>
                  <p>
                    Permission is granted to temporarily use StayKha for
                    personal or commercial property management purposes. This is
                    the grant of a license, not a transfer of title, and under
                    this license you may not:
                  </p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Modify or copy the materials</li>
                    <li>
                      Use the materials for any commercial purpose or for any
                      public display
                    </li>
                    <li>
                      Attempt to reverse engineer any software contained in
                      StayKha
                    </li>
                    <li>
                      Remove any copyright or other proprietary notations from
                      the materials
                    </li>
                  </ul>
                  <h3 className="text-xl font-semibold text-foreground">
                    1.2 Account Responsibility
                  </h3>
                  <p>
                    You are responsible for maintaining the confidentiality of
                    your account credentials and for all activities that occur
                    under your account. You agree to notify us immediately of
                    any unauthorized use of your account.
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    1.3 Service Availability
                  </h3>
                  <p>
                    We strive to provide continuous access to StayKha, but we do
                    not guarantee uninterrupted or error-free service. We
                    reserve the right to modify, suspend, or discontinue any
                    part of the service at any time.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  2. Privacy Policy
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    Your privacy is important to us. This Privacy Policy
                    explains how we collect, use, and protect your information
                    when you use StayKha.
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.1 Information We Collect
                  </h3>
                  <p>
                    We collect information that you provide directly to us,
                    including:
                  </p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Account information (name, email address, password)</li>
                    <li>Property and tenant data you enter into the system</li>
                    <li>Meter readings and billing information</li>
                    <li>Usage data and analytics</li>
                  </ul>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.2 How We Use Your Information
                  </h3>
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>
                      Send technical notices, updates, and support messages
                    </li>
                    <li>Respond to your comments and questions</li>
                    <li>Monitor and analyze trends and usage</li>
                  </ul>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.3 Data Security
                  </h3>
                  <p>
                    We implement appropriate technical and organizational
                    measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction.
                    However, no method of transmission over the Internet is 100%
                    secure.
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.4 Data Retention
                  </h3>
                  <p>
                    We retain your information for as long as your account is
                    active or as needed to provide you services. You may request
                    deletion of your account and associated data at any time.
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.5 Third-Party Services
                  </h3>
                  <p>
                    StayKha uses PocketBase as a backend service. Your data is
                    stored securely on PocketBase servers. Please refer to
                    PocketBase's privacy policy for information about their data
                    handling practices.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  3. User Data and Content
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <h3 className="text-xl font-semibold text-foreground">
                    3.1 Your Content
                  </h3>
                  <p>
                    You retain ownership of all data and content you upload or
                    enter into StayKha. You grant us a license to use, store,
                    and process this data solely for the purpose of providing
                    the service to you.
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    3.2 Data Export
                  </h3>
                  <p>
                    You may export your data at any time through the application
                    interface. We provide tools to download your information in
                    standard formats.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  4. Limitation of Liability
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    StayKha is provided "as is" without warranties of any kind.
                    We shall not be liable for any indirect, incidental,
                    special, consequential, or punitive damages resulting from
                    your use of or inability to use the service.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  5. Changes to Terms
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    We reserve the right to modify these terms at any time. We
                    will notify users of any material changes by posting the new
                    terms on this page and updating the "Last updated" date.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  6. Contact Us
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    If you have any questions about these Terms of Service or
                    Privacy Policy, please contact us through the application or
                    at the contact information provided in your account
                    settings.
                  </p>
                </div>
              </section>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
