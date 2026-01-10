"use client";

import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/router";

export default function NotFoundPage() {
  const router = useRouter();

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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">ไม่พบหน้านี้</h1>
          <p className="text-sm text-muted-foreground">
            ลิงก์อาจถูกย้ายหรือลบไปแล้ว ลองกลับไปหน้าก่อนหน้า หรือไปที่ภาพรวม
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={handleBack}>
            กลับหน้าก่อนหน้า
          </Button>
          <Button asChild>
            <Link to="/overview">ไปที่ภาพรวม</Link>
          </Button>
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
