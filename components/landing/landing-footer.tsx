"use client";

import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { StayKhaLogo } from "@/components/staykha-logo";

export function LandingFooter() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.footer
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.3 }}
      className="border-t border-white/70 bg-white/80 backdrop-blur"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-white">
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
            <p className="text-sm text-slate-600">
              ระบบบริหารจัดการที่พักสำหรับหอพักและบ้านเช่า จัดการอาคาร ห้องพัก ผู้เช่า
              การอ่านมิเตอร์ และการออกบิล รองรับหลายผู้ดูแลและเวิร์กโฟลว์อัตโนมัติ
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">บัญชีผู้ใช้</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link
                  to="/login"
                  className="hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-slate-900 transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  to="/forgot-password"
                  className="hover:text-slate-900 transition-colors"
                >
                  Reset Password
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">ข้อกฎหมาย</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-slate-900 transition-colors"
                >
                  ข้อกำหนดและความเป็นส่วนตัว
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/70 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} StayKha สงวนลิขสิทธิ์
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link
                to="/terms"
                className="hover:text-slate-900 transition-colors"
              >
                ข้อกำหนดการใช้งาน
              </Link>
              <span>•</span>
              <Link
                to="/terms"
                className="hover:text-slate-900 transition-colors"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
