"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, PlugZap, Send } from "lucide-react";

const steps = [
  {
    title: "ตั้งค่าอาคารและห้อง",
    description: "นำเข้าข้อมูลครั้งเดียว ใช้ต่อได้ทุกเดือน",
    icon: ClipboardList,
    time: "10-15 นาที",
  },
  {
    title: "อ่านมิเตอร์และตรวจยอด",
    description: "อัปโหลดรูปแล้วให้ระบบสรุปยอดให้ทันที",
    icon: PlugZap,
    time: "1 นาที/ห้อง",
  },
  {
    title: "ออกบิลและส่งแจ้งเตือน",
    description: "สร้างใบแจ้งหนี้อัตโนมัติ",
    icon: Send,
    time: "อัตโนมัติ",
  },
];

export function LandingWorkflow() {
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
      id="workflow"
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
      className="mt-16 scroll-mt-24"
    >
      <motion.div variants={fadeUp} className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
          Workflow ที่ชัดเจน
        </p>
        <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">
          ระบบเดียวจบ ตั้งค่าครั้งเดียว
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-base text-slate-600 sm:text-lg">
          ลดงานซ้ำและลดความผิดพลาด
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.7, 
                delay: index * 0.2,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ scale: 1.05, y: -8, rotateY: 2 }}
              className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-lg backdrop-blur transition-shadow hover:shadow-xl"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
                className="pointer-events-none absolute -right-20 -top-16 h-36 w-36 rounded-full bg-slate-200/60 blur-3xl"
              />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                  >
                    Step {index + 1}
                  </motion.span>
                  <motion.span
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {step.description}
                  </p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    className="mt-3 text-xs font-semibold text-slate-700"
                  >
                    ⚡ {step.time}
                  </motion.p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
