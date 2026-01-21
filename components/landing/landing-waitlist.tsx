"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const waitlistUrl = "https://typeform.com/to/your-form";

export function LandingWaitlist() {
  const shouldReduceMotion = useReducedMotion();
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: shouldReduceMotion ? undefined : { staggerChildren: 0.12 },
        },
      }}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      id="waitlist"
      className="relative mt-16 scroll-mt-24 overflow-hidden rounded-3xl border border-dashed border-slate-200/80 bg-white/80 px-6 py-12 shadow-xl backdrop-blur sm:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(203,213,225,0.22),_transparent_60%)]" />
      <div className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-slate-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-8 h-56 w-56 rounded-full bg-slate-200/40 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div variants={fadeUp} className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Join Waitlist
          </span>
          <h2 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">
            เข้าร่วมลิสต์เพื่อทดลองเวอร์ชันใหม่ก่อนใคร
          </h2>
          <p className="max-w-xl text-base text-slate-600 sm:text-lg">
            รับสิทธิ์ทดลองใช้งานก่อนเปิดตัว พร้อมเทมเพลตใบแจ้งหนี้และฟีเจอร์ใหม่สำหรับทีมผู้ดูแล
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "คู่มือเริ่มต้นสำหรับเจ้าของใหม่",
              "เทมเพลตใบแจ้งหนี้ภาษาไทย",
              "สิทธิ์ทดลองระบบแจ้งเตือนอัตโนมัติ",
            ].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1 + 0.3,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.01 }}
          onSubmit={(event) => {
            event.preventDefault();
            if (waitlistUrl) {
              window.open(waitlistUrl, "_blank", "noopener,noreferrer");
            }
          }}
          className="rounded-2xl border border-white/70 bg-white p-6 shadow-xl"
        >
          <label className="text-sm font-semibold text-slate-900">
            อีเมลสำหรับรับสิทธิ์
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                name="email"
                placeholder="you@company.com…"
                autoComplete="email"
                className="pl-9"
                aria-label="อีเมลสำหรับรอรับสิทธิ์"
                aria-describedby="waitlist-email-help"
                inputMode="email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="sm:min-w-[160px] bg-slate-900 text-white hover:bg-slate-900/90"
            >
              เข้าร่วม
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p id="waitlist-email-help" className="mt-3 text-xs text-slate-500">
            คลิกเพื่อเปิดแบบฟอร์ม Typeform (เปลี่ยนลิงก์ภายหลังได้)
          </p>
          <p className="mt-2 text-xs text-slate-500">
            เราจะติดต่อเฉพาะเพื่อการทดลองใช้งาน ไม่มีสแปม
          </p>
        </motion.form>
      </div>
    </motion.section>
  );
}
