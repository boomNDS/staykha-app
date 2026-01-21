"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, LineChart, Zap } from "lucide-react";

const stats = [
  {
    label: "ประหยัดเวลา",
    value: "4-5 ชม.",
    icon: Zap,
  },
  {
    label: "ติดตามรายรับ",
    value: "+32%",
    icon: LineChart,
  },
  {
    label: "หลายอาคาร",
    value: "5-40",
    icon: Building2,
  },
];

export function LandingProof() {
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
            : { staggerChildren: 0.15 },
        },
      }}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mt-14"
    >
      <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur sm:p-8">
        <motion.div variants={fadeUp} className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            ผลลัพธ์ที่ได้
          </p>
          <h2 className="mt-3 font-heading text-2xl font-semibold text-slate-900 sm:text-3xl">
            ประหยัดเวลาและเห็นภาพรวมชัดเจนขึ้น
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ scale: 1.05, y: -4, rotateZ: 1 }}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "easeInOut",
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="text-2xl font-semibold text-slate-900"
                  >
                    {stat.value}
                  </motion.span>
                </motion.div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
