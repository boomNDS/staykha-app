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
import { authApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { registerSchema } from "@/lib/schemas";
import type { z } from "zod";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  usePageTitle("Sign up");

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      role: "admin",
    },
  });

  React.useEffect(() => {
    if (user) {
      router.push("/overview");
    }
  }, [user, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const { user } = await authApi.register(
        data.email,
        data.password,
        data.passwordConfirm,
        data.name,
        data.role,
      );

      // Store user temporarily for next step
      localStorage.setItem("tempUser", JSON.stringify(user));

      toast({
        title: "สมัครสำเร็จ",
        description:
          data.role === "owner"
            ? "สร้างทีมของคุณเพื่อเริ่มต้นใช้งาน"
            : "กรอกรหัสคำเชิญเพื่อเข้าร่วมทีม",
      });

      // Redirect based on role
      if (data.role === "owner") {
        router.push("/register/create-team");
      } else {
        router.push("/register/join-team");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง";
      toast({
        title: "สมัครไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEO
        title="Sign up"
        description="Create an account to manage buildings, rooms, tenants, and invoices."
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
                สมัครใช้งานเพื่อเริ่มจัดการที่พัก
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                สร้างบัญชีเพื่อจัดการอาคาร ห้อง ผู้เช่า และบิลได้อย่างเป็นระบบ
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                จัดการหลายอาคารและหลายห้องได้ในที่เดียว
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                ติดตามการอ่านมิเตอร์และสร้างใบแจ้งหนี้
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                ใช้งานได้ทุกที่ ทุกเวลา
              </div>
            </div>
          </div>

          <Card className="w-full max-w-md justify-self-center border-border/60 bg-card/90 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Gauge className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                สมัครใช้งาน
              </CardTitle>
              <CardDescription>กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อ</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="สมชาย ใจดี"
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@example.com"
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

                  <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ฉันคือ...</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => field.onChange("owner")}
                              disabled={form.formState.isSubmitting}
                              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                                field.value === "owner"
                                  ? "border-slate-400 bg-slate-100"
                                  : "border-border hover:border-slate-300"
                              } ${
                                form.formState.errors.role
                                  ? "border-destructive"
                                  : ""
                              }`}
                            >
                              <div className="font-medium">เจ้าของ</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                สร้างและจัดการทีมของคุณ
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange("admin")}
                              disabled={form.formState.isSubmitting}
                              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                                field.value === "admin"
                                  ? "border-slate-400 bg-slate-100"
                                  : "border-border hover:border-slate-300"
                              } ${
                                form.formState.errors.role
                                  ? "border-destructive"
                                  : ""
                              }`}
                            >
                              <div className="font-medium">ผู้ดูแล</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                เข้าร่วมทีมที่มีอยู่แล้ว
                              </div>
                            </button>
                          </div>
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
                        กำลังสมัครใช้งาน...
                      </>
                    ) : (
                      "สมัครใช้งาน"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">มีบัญชีอยู่แล้วใช่ไหม? </span>
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
