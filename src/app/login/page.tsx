"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Gauge, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { normalizeErrorMessage } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { loginSchema } from "@/lib/schemas";
import type { z } from "zod";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  usePageTitle(
    "Sign in",
    "Sign in to manage buildings, track meter readings, and issue invoices.",
  );

  const router = useRouter();
  const { login, user } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      // Check if user needs to create/join team
      if (!user.teamId) {
        if (user.role === "owner") {
          router.push("/register/create-team");
        } else if (user.role === "admin") {
          router.push("/register/join-team");
        } else {
          router.push("/overview");
        }
      } else {
        router.push("/overview");
      }
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);

      toast({
        title: "Login สำเร็จ",
        description: "ยินดีต้อนรับกลับมา",
      });

      // Redirect will be handled by useEffect when user state updates
    } catch (error: unknown) {
      const message = normalizeErrorMessage(
        error,
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      );
      toast({
        title: "Login ไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
    }
  };

  const quickLogin = (email: string, password: string) => {
    form.setValue("email", email);
    form.setValue("password", password);
  };

  return (
    <>
      <SEO
        title="Sign in"
        description="Sign in to manage buildings, track meter readings, and issue invoices."
        noindex={true}
      />
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_55%)]" />
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-10 shadow-xl backdrop-blur lg:flex">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                พอร์ทัลผู้ดูแล StayKha
              </p>
              <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-foreground">
                เข้าสู่ระบบเพื่อจัดการงานรายวัน
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                ติดตามการอ่านมิเตอร์ จัดการผู้เช่า และออกใบแจ้งหนี้
                ด้วยเวิร์กโฟลว์ที่ชัดเจนในหน้าจอเดียว
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                ภาพรวมสถานะห้องและบิลแบบเรียลไทม์
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                อ่านค่ามิเตอร์อัตโนมัติด้วย OCR
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                ใบแจ้งหนี้พร้อมส่งออกและตรวจสอบย้อนหลัง
              </div>
            </div>
          </div>

          <Card className="w-full max-w-md justify-self-center border-border/60 bg-card/90 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Gauge className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                เข้าสู่ระบบ
              </CardTitle>
              <CardDescription>กรอกข้อมูลเพื่อเข้าสู่พอร์ทัลผู้ดูแล</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@staykha.com"
                            disabled={form.formState.isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>รหัสผ่าน</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            disabled={form.formState.isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังเข้าสู่ระบบ...
                      </>
                    ) : (
                      "เข้าสู่ระบบ"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-4 flex items-center justify-between text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
                <div>
                  <span className="text-muted-foreground">ยังไม่มีบัญชีใช่ไหม? </span>
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:underline"
                  >
                    สมัครใช้งาน
                  </Link>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  บัญชีตัวอย่าง:
                </p>
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("owner@staykha.com", "password123")}
                    className="w-full justify-start text-left"
                    type="button"
                  >
                    <span className="flex-1">เจ้าของ - สิทธิ์เต็ม</span>
                    <span className="text-xs text-muted-foreground">
                      owner@staykha.com
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("admin@staykha.com", "password123")}
                    className="w-full justify-start text-left"
                    type="button"
                  >
                    <span className="flex-1">ผู้ดูแล - สิทธิ์ผู้จัดการ</span>
                    <span className="text-xs text-muted-foreground">
                      admin@staykha.com
                    </span>
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  รหัสผ่าน: password123, owner123 หรือ admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
