"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Calculator,
  Clock,
  FileSpreadsheet,
  TrendingDown,
} from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "งานซ้ำซากทุกเดือน",
    description: "ใช้เวลา 4-6 ชั่วโมงต่อเดือนกับงานที่ทำซ้ำ",
    pain: "เสียเวลามาก",
  },
  {
    icon: Calculator,
    title: "คำนวณผิดพลาดบ่อย",
    description: "การคำนวณด้วยมือทำให้เกิดข้อผิดพลาด",
    pain: "ต้องแก้ไขบิลบ่อย",
  },
  {
    icon: Clock,
    title: "ติดตามค้างชำระยาก",
    description: "ไม่เห็นภาพรวมสถานะการชำระ",
    pain: "ข้อมูลกระจัดกระจาย",
  },
];

export function LandingProblems() {
  const shouldReduceMotion = useReducedMotion();
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
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
          transition: shouldReduceMotion
            ? undefined
            : { staggerChildren: 0.1 },
        },
      }}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mt-16"
    >
      <div className="space-y-6">
        <motion.div variants={fadeUp} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            ปัญหาที่พบเจอ
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">
            หมดเวลากับงานซ้ำซากและข้อผิดพลาด
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-base text-slate-600 sm:text-lg">
            หลายทีมยังใช้วิธีเดิมที่ใช้เวลานานและเสี่ยงผิดพลาด
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30, scale: 0.9 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/50 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-100/40 blur-2xl"
                />
                <div className="relative space-y-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700">
                      <Icon className="h-5 w-5" />
                    </span>
                  </motion.div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {problem.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          variants={fadeUp}
          className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 text-center shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-700">
            StayKha ช่วยแก้ปัญหาทั้งหมดนี้ด้วยระบบอัตโนมัติที่ใช้งานง่าย
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
