"use client";

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function LandingCTA() {
  return (
    <motion.section
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12 } },
      }}
      initial="hidden"
      animate="show"
      className="mt-16 rounded-3xl border border-primary/20 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(56,189,248,0.12))] p-8"
    >
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
            เริ่มต้นอย่างรวดเร็ว
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            พร้อมยกระดับการจัดการที่พักของคุณหรือยัง?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            จัดการอาคาร ห้องพัก ผู้เช่า การอ่านมิเตอร์ และการออกบิลด้วยเวิร์กโฟลว์อัตโนมัติ
            รองรับหลายผู้ดูแล ตั้งค่าได้ยืดหยุ่น—ออกแบบมาเพื่อเจ้าของที่พักโดยเฉพาะ
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/login">
              สร้างที่พักแรกของคุณ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/overview/billing">ดูเวิร์กโฟลว์การออกบิล</Link>
          </Button>
        </div>
      </motion.div>
    </motion.section>
  );
}
