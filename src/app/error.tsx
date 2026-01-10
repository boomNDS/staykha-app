"use client";

import { Link } from "@tanstack/react-router";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/router";

type ErrorPageProps = {
  error?: Error;
};

const errorMessages: Record<number, { title: string; description: string }> = {
  400: {
    title: "คำขอไม่ถูกต้อง",
    description: "คำขอนี้ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
  },
  401: {
    title: "ต้องเข้าสู่ระบบ",
    description: "กรุณา Sign in เพื่อเข้าถึงหน้านี้",
  },
  403: {
    title: "ไม่มีสิทธิ์เข้าถึง",
    description: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแล",
  },
  500: {
    title: "เกิดข้อผิดพลาดในระบบ",
    description: "ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง",
  },
  502: {
    title: "เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง",
    description: "บริการมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง",
  },
  503: {
    title: "ระบบกำลังบำรุงรักษา",
    description: "ขณะนี้ระบบกำลังบำรุงรักษา กรุณากลับมาใหม่อีกครั้ง",
  },
};

export default function ErrorPage({ error }: ErrorPageProps) {
  const router = useRouter();
  const codeParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("code")
      : null;
  const code = codeParam ? Number.parseInt(codeParam, 10) : null;
  const message =
    code && errorMessages[code]
      ? errorMessages[code]
      : {
          title: "เกิดข้อผิดพลาด",
          description: "ขออภัย มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง",
        };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/overview");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-xl backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertOctagon className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {message.title}
          </h1>
          <p className="text-sm text-muted-foreground">{message.description}</p>
        </div>
        {code && (
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Error {code}
          </div>
        )}
        {error?.message && (
          <div className="rounded-xl border border-border bg-background/70 p-3 text-xs text-muted-foreground">
            {error.message}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={handleBack}>
            กลับหน้าก่อนหน้า
          </Button>
          <Button onClick={() => window.location.reload()}>รีเฟรชหน้า</Button>
        </div>
        <div className="text-xs text-muted-foreground">
          หรือกลับสู่หน้าแรก{" "}
          <Link to="/" className="text-primary hover:underline">
            หน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
