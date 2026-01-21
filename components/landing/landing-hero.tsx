"use client";

import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Typewriter } from "@/components/typewriter";
import { Button } from "@/components/ui/button";

export function LandingHero() {
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
      animate="show"
      className="space-y-12"
    >
      {/* Hero Content */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <motion.div variants={fadeUp} className="space-y-6">
          <motion.h1
            variants={fadeUp}
            className="font-heading text-balance text-5xl font-bold leading-tight text-slate-900 sm:text-6xl lg:text-7xl"
          >
            <Typewriter
              text={[
                "จัดการหอพักและบ้านเช่าแบบครบวงจร",
                "ออกบิลอัตโนมัติในมุมมองเดียว",
                "ทีมงานทำงานพร้อมกันได้ทันที",
              ]}
              speed={50}
              initialDelay={400}
              waitTime={2400}
              deleteSpeed={30}
              loop={true}
              className="block"
              showCursor={true}
              cursorChar="|"
              cursorClassName="ml-1 text-slate-600"
            />
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-pretty text-lg text-slate-600 sm:text-xl max-w-2xl mx-auto"
          >
            ลดเวลาทำงานจาก 4-6 ชั่วโมงเหลือ 30 นาทีต่อเดือน
            <br />
            ด้วยระบบอัตโนมัติที่ช่วยจัดการอาคาร ห้อง ผู้เช่า อ่านมิเตอร์
            และออกบิลได้ในที่เดียว
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              asChild
              size="lg"
              className="bg-slate-900 text-white hover:bg-slate-900/90 text-base px-8 py-6"
            >
              <Link to="/login">
                เริ่มใช้งานฟรี
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-base px-8 py-6"
            >
              <Link to="/overview/billing">ดูตัวอย่างบิล</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Large Central Visual Placeholder */}
      <motion.div
        variants={fadeUp}
        className="relative max-w-5xl mx-auto"
      >
        <motion.div
          animate={{
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-br from-slate-200/30 via-slate-100/20 to-transparent blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-2xl"
        >
          {/* Large Dashboard Preview Placeholder */}
          <div className="aspect-[16/10] bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="flex h-full items-center justify-center p-8">
              <div className="w-full h-full space-y-4">
                {/* Simulated Dashboard UI */}
                <div className="grid grid-cols-3 gap-4 h-full">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.2 + 0.5 }}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="h-3 w-20 bg-slate-200 rounded" />
                        <div className="h-8 w-full bg-slate-100 rounded" />
                        <div className="h-4 w-16 bg-slate-200 rounded" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center pt-4">
                  <p className="text-sm font-medium text-slate-400">
                    Dashboard Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
