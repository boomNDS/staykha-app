"use client";

import { Link } from "@tanstack/react-router";
import { Gauge, Loader2, Mail } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api-client";
import { useRouter } from "@/lib/router";
import { forgotPasswordSchema, mapZodErrors } from "@/lib/schemas";
import { usePageTitle } from "@/lib/use-page-title";

export default function ForgotPasswordPage() {
  usePageTitle("Reset Password");

  const _router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.requestPasswordReset(formData.email);
      setIsSuccess(true);
      toast({
        title: "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว",
        description: "โปรดตรวจสอบอีเมลเพื่อทำการรีเซ็ตรหัสผ่าน",
      });
    } catch (error: any) {
      toast({
        title: "ส่งลิงก์ไม่สำเร็จ",
        description: error.message || "กรุณาตรวจสอบอีเมลและลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_55%)]" />
        <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              โปรดตรวจสอบอีเมล
            </CardTitle>
            <CardDescription>
              เราได้ส่งคำแนะนำการรีเซ็ตรหัสผ่านไปที่ {formData.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              คลิกลิงก์ในอีเมลเพื่อรีเซ็ตรหัสผ่าน หากไม่พบให้ตรวจสอบโฟลเดอร์สแปม
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link to="/login">กลับไปหน้า Sign in</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSuccess(false);
                  setFormData({ email: "" });
                }}
              >
                ส่งอีเมลอีกครั้ง
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_55%)]" />
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-10 shadow-xl backdrop-blur lg:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">
              ผู้ดูแล StayKha
            </p>
            <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Reset Password
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              ขั้นตอนรีเซ็ตรหัสผ่านที่ปลอดภัย
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              ลิงก์หมดอายุภายใน 1 ชั่วโมง
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              ตรวจสอบกล่องจดหมายของคุณ
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md justify-self-center border-border/60 bg-card/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              ลืมรหัสผ่าน?
            </CardTitle>
            <CardDescription>
              กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  อีเมล
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={isLoading}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  "ส่งลิงก์รีเซ็ตรหัสผ่าน"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                จำรหัสผ่านได้แล้วใช่ไหม?{" "}
              </span>
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
