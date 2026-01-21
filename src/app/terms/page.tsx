"use client";

import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { StayKhaLogo } from "@/components/staykha-logo";
import { Button } from "@/components/ui/button";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

export default function TermsPage() {
  usePageTitle("ข้อกำหนดและนโยบายความเป็นส่วนตัว");
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
    <>
      <SEO
        title="ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว"
        description="ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวของ StayKha สำหรับการจัดการที่พักและข้อมูลผู้เช่า"
      />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_55%)]">
      <motion.header
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: "easeOut" }}
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
              ชุดเครื่องมือสำหรับเจ้าของ
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </Button>
      </motion.header>

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 pt-10">
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: shouldReduceMotion ? undefined : { staggerChildren: 0.1 },
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
                  ข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว
                </h1>
                <p className="text-sm text-muted-foreground">
                  อัปเดตล่าสุด: {new Date().toLocaleDateString("th-TH")}
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
                  1. ข้อกำหนดการใช้งาน
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    เมื่อเข้าถึงและใช้งาน StayKha ถือว่าคุณยอมรับและตกลงตาม
                    ข้อกำหนดและเงื่อนไขการใช้งานในเอกสารนี้
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    1.1 สิทธิ์การใช้งาน
                  </h3>
                  <p>
                    อนุญาตให้ใช้ StayKha เพื่อการจัดการทรัพย์สินส่วนบุคคลหรือเชิงพาณิชย์
                    การใช้งานนี้เป็นการให้สิทธิ์ใช้งาน ไม่ใช่การโอนกรรมสิทธิ์ และคุณไม่สามารถ:
                  </p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>ดัดแปลงหรือคัดลอกเนื้อหา</li>
                    <li>ใช้เนื้อหาเพื่อวัตถุประสงค์อื่นนอกเหนือจากการจัดการทรัพย์สิน</li>
                    <li>
                      พยายามถอดรหัสหรือทำวิศวกรรมย้อนกลับซอฟต์แวร์ใด ๆ ใน StayKha
                    </li>
                    <li>ลบข้อความลิขสิทธิ์หรือข้อสงวนสิทธิ์อื่น ๆ</li>
                  </ul>
                  <h3 className="text-xl font-semibold text-foreground">
                    1.2 ความรับผิดชอบของบัญชี
                  </h3>
                  <p>
                    คุณมีหน้าที่รักษาความลับของข้อมูลบัญชีและรับผิดชอบกิจกรรมทั้งหมด
                    ที่เกิดขึ้นภายใต้บัญชีของคุณ และต้องแจ้งให้เราทราบทันทีเมื่อพบ
                    การใช้งานบัญชีโดยไม่ได้รับอนุญาต
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    1.3 ความพร้อมให้บริการ
                  </h3>
                  <p>
                    เราพยายามให้บริการอย่างต่อเนื่อง แต่ไม่รับประกันว่าจะไม่มีข้อผิดพลาด
                    หรือการหยุดชะงัก และขอสงวนสิทธิ์ในการปรับปรุง ระงับ หรือยุติบริการ
                    บางส่วนได้ทุกเมื่อ
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  2. นโยบายความเป็นส่วนตัว
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    ความเป็นส่วนตัวของคุณสำคัญสำหรับเรา นโยบายนี้อธิบายวิธีที่เรา เก็บรวบรวม
                    ใช้งาน และปกป้องข้อมูลเมื่อคุณใช้งาน StayKha
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.1 ข้อมูลที่เราเก็บรวบรวม
                  </h3>
                  <p>เราเก็บข้อมูลที่คุณให้กับเราโดยตรง เช่น:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>ข้อมูลบัญชี (ชื่อ อีเมล รหัสผ่าน)</li>
                    <li>ข้อมูลอาคาร ห้อง และผู้เช่าที่คุณบันทึก</li>
                    <li>ข้อมูลการอ่านมิเตอร์และการออกบิล</li>
                    <li>ข้อมูลการใช้งานและสถิติ</li>
                  </ul>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.2 การใช้ข้อมูลของคุณ
                  </h3>
                  <p>เราใช้ข้อมูลที่เก็บรวบรวมเพื่อ:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>ให้บริการ ดูแล และพัฒนาระบบ</li>
                    <li>ประมวลผลข้อมูลและส่งข้อมูลที่เกี่ยวข้อง</li>
                    <li>แจ้งเตือน อัปเดต และข้อความสนับสนุน</li>
                    <li>ตอบกลับข้อเสนอแนะและคำถาม</li>
                    <li>ติดตามและวิเคราะห์แนวโน้มการใช้งาน</li>
                  </ul>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.3 ความปลอดภัยของข้อมูล
                  </h3>
                  <p>
                    เรามีมาตรการทางเทคนิคและการจัดการที่เหมาะสมเพื่อปกป้องข้อมูล
                    อย่างไรก็ตาม ไม่มีวิธีใดบนอินเทอร์เน็ตที่ปลอดภัยได้ 100%
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.4 การเก็บรักษาข้อมูล
                  </h3>
                  <p>
                    เราจะเก็บข้อมูลตราบเท่าที่บัญชีของคุณยังใช้งานอยู่หรือจำเป็นต่อการให้บริการ
                    คุณสามารถขอลบบัญชีและข้อมูลที่เกี่ยวข้องได้ทุกเมื่อ
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    2.5 บริการจากบุคคลที่สาม
                  </h3>
                  <p>
                    StayKha ใช้ระบบหลังบ้านผ่าน API ที่มีการยืนยันตัวตนด้วยโทเคน
                    ข้อมูลของคุณจะถูกจัดเก็บอย่างปลอดภัยบนเซิร์ฟเวอร์ของผู้ให้บริการ
                    โปรดอ่านนโยบายความเป็นส่วนตัวของผู้ให้บริการสำหรับรายละเอียดเพิ่มเติม
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  3. ข้อมูลและเนื้อหาของผู้ใช้
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <h3 className="text-xl font-semibold text-foreground">
                    3.1 เนื้อหาของคุณ
                  </h3>
                  <p>
                    คุณยังคงเป็นเจ้าของข้อมูลที่อัปโหลดหรือบันทึกใน StayKha และยินยอมให้เราใช้
                    เก็บ และประมวลผลข้อมูลเพื่อให้บริการเท่านั้น
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">
                    3.2 การส่งออกข้อมูล
                  </h3>
                  <p>
                    คุณสามารถส่งออกข้อมูลได้ตลอดเวลาผ่านแอปพลิเคชัน เราจัดเตรียมเครื่องมือ
                    สำหรับดาวน์โหลดข้อมูลในรูปแบบมาตรฐาน
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  4. ข้อจำกัดความรับผิด
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    StayKha ให้บริการตามสภาพที่เป็นอยู่โดยไม่มีการรับประกันใด ๆ
                    เราจะไม่รับผิดชอบต่อความเสียหายทางอ้อม พิเศษ หรือโดยบังเอิญ
                    ที่เกิดจากการใช้งานหรือไม่สามารถใช้งานบริการได้
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  5. การเปลี่ยนแปลงข้อกำหนด
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดเมื่อใดก็ได้ โดยจะแจ้งให้ทราบ
                    ผ่านการอัปเดตในหน้านี้และระบุวันที่อัปเดตล่าสุด
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground">
                  6. ติดต่อเรา
                </h2>
                <div className="mt-4 space-y-4 text-muted-foreground">
                  <p>
                    หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งานหรือนโยบายความเป็นส่วนตัว
                    กรุณาติดต่อเราผ่านแอปพลิเคชันหรือข้อมูลติดต่อที่ตั้งค่าไว้ในบัญชีของคุณ
                  </p>
                </div>
              </section>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับหน้าแรก
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>
      </div>
    </>
  );
}
