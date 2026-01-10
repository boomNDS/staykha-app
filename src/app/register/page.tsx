"use client";

import { Link } from "@tanstack/react-router";
import { Gauge, Loader2 } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { mapZodErrors, registerSchema } from "@/lib/schemas";
import { usePageTitle } from "@/lib/use-page-title";

export default function RegisterPage() {
  usePageTitle("Sign up");

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    role: "admin" as "owner" | "admin",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (user) {
      router.push("/overview");
    }
  }, [user, router]);

  const validateForm = () => {
    const result = registerSchema.safeParse(formData);
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
      const { user } = await authApi.register(
        formData.email,
        formData.password,
        formData.passwordConfirm,
        formData.name,
        formData.role,
      );

      // Store user temporarily for next step
      localStorage.setItem("tempUser", JSON.stringify(user));

      toast({
        title: "สมัครสำเร็จ",
        description:
          formData.role === "owner"
            ? "สร้างทีมของคุณเพื่อเริ่มต้นใช้งาน"
            : "กรอกรหัสคำเชิญเพื่อเข้าร่วมทีม",
      });

      // Redirect based on role
      if (formData.role === "owner") {
        router.push("/register/create-team");
      } else {
        router.push("/register/join-team");
      }
    } catch (error: any) {
      toast({
        title: "สมัครไม่สำเร็จ",
        description: error.message || "ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              เข้าร่วม StayKha
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              สร้างบัญชีเพื่อเริ่มจัดการอาคาร ห้อง ผู้เช่า และบิลได้อย่างง่ายดาย
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
              Sign up
            </CardTitle>
            <CardDescription>กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  ชื่อ
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="สมชาย ใจดี"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isLoading}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

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

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  รหัสผ่าน
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={isLoading}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="passwordConfirm"
                  className="text-sm font-medium text-foreground"
                >
                  ยืนยันรหัสผ่าน
                </label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passwordConfirm: e.target.value,
                    })
                  }
                  disabled={isLoading}
                  className={errors.passwordConfirm ? "border-destructive" : ""}
                />
                {errors.passwordConfirm && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.passwordConfirm}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-foreground"
                >
                  ฉันคือ...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "owner" })}
                    disabled={isLoading}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      formData.role === "owner"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${errors.role ? "border-destructive" : ""}`}
                  >
                    <div className="font-medium">เจ้าของ</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      สร้างและจัดการทีมของคุณ
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "admin" })}
                    disabled={isLoading}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      formData.role === "admin"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${errors.role ? "border-destructive" : ""}`}
                  >
                    <div className="font-medium">ผู้ดูแล</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      เข้าร่วมทีมที่มีอยู่แล้ว
                    </div>
                  </button>
                </div>
                {errors.role && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.role}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสมัครใช้งาน...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">มีบัญชีอยู่แล้วใช่ไหม? </span>
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
