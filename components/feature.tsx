"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building, FileText, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    title: "จัดการอาคาร & ห้องพัก",
    description:
      "ติดตามสถานะอาคาร ห้องพัก และผู้ดูแลในมุมมองเดียว พร้อมแผนผังห้องที่อัปเดตทันที",
    icon: Building,
    imageSide: "right" as const,
    gradient: "from-blue-100/50 to-purple-100/50",
  },
  {
    title: "อ่านมิเตอร์อัตโนมัติ",
    description:
      "อัปโหลดภาพและดึงค่าด้วย OCR เพื่อลดการพิมพ์ซ้ำและส่งต่อข้อมูลอย่างแม่นยำ",
    icon: Zap,
    imageSide: "left" as const,
    gradient: "from-yellow-100/50 to-orange-100/50",
  },
  {
    title: "บิลอัจฉริยะ",
    description:
      "คำนวณค่าน้ำค่าไฟอัตโนมัติ สร้างใบแจ้งหนี้ PDF ภาษาไทย และติดตามสถานะการชำระอย่างเป็นระบบ",
    icon: FileText,
    imageSide: "right" as const,
    gradient: "from-green-100/50 to-teal-100/50",
  },
  {
    title: "ทีม & สิทธิ์",
    description:
      "กำหนดบทบาทผู้ดูแล ทีมงาน และสิทธิ์เข้าใช้งานได้ที่เดียว พร้อมความปลอดภัยระดับธุรกิจ",
    icon: ShieldCheck,
    imageSide: "left" as const,
    gradient: "from-pink-100/50 to-rose-100/50",
  },
];

export function Features() {
  const shouldReduceMotion = useReducedMotion();
  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      id="features"
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
      viewport={{ once: true, margin: "-100px" }}
      className="relative mt-24 scroll-mt-24 space-y-24"
    >
      {features.map((feature, index) => {
        const Icon = feature.icon;
        const isImageRight = feature.imageSide === "right";

        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={`grid gap-12 lg:grid-cols-2 lg:items-center ${
              isImageRight ? "" : "lg:grid-flow-dense"
            }`}
          >
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: isImageRight ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className={`space-y-6 ${isImageRight ? "" : "lg:col-start-2"}`}
            >
              <div className="inline-flex items-center gap-3">
                <motion.span
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
                >
                  <Icon className="h-7 w-7" />
                </motion.span>
              </div>
              <h3 className="font-heading text-3xl font-semibold text-slate-900 sm:text-4xl">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
                {feature.description}
              </p>
            </motion.div>

            {/* Image Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: isImageRight ? 50 : -50, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className={`relative ${isImageRight ? "" : "lg:col-start-1"}`}
            >
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 2 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-xl"
              >
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear",
                  }}
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-30`}
                />
                <div className="aspect-[4/3] relative flex items-center justify-center p-8">
                  <div className="w-full h-full space-y-4">
                    {/* Simulated UI Elements */}
                    <div className="grid grid-cols-2 gap-3 h-full">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + index * 0.2 }}
                          className="rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm"
                        >
                          <div className="space-y-2">
                            <div className="h-2 w-16 bg-slate-200 rounded" />
                            <div className="h-6 w-full bg-slate-100 rounded" />
                            <div className="h-3 w-12 bg-slate-200 rounded" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
