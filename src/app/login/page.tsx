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
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { loginSchema, mapZodErrors } from "@/lib/schemas";
import { SEO } from "@/lib/seo";
import { usePageTitle } from "@/lib/use-page-title";

export default function LoginPage() {
  usePageTitle(
    "Sign in",
    "Sign in to StayKha to manage your properties, track meter readings, and generate utility bills.",
  );

  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Login Page] Form submitted", { email: formData.email });

    if (!validateForm()) {
      console.log("[Login Page] Form validation failed");
      return;
    }

    setIsLoading(true);
    console.log("[Login Page] Calling login function...");

    try {
      await login(formData.email, formData.password);
      console.log("[Login Page] Login successful, redirecting...");

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      router.push("/overview");
    } catch (error: any) {
      console.error("[Login Page] Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <>
      <SEO
        title="Sign in"
        description="Sign in to StayKha to manage your properties, track meter readings, and generate utility bills."
        noindex={true}
      />
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_55%)]" />
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-center gap-6 rounded-3xl border border-border/60 bg-card/80 p-10 shadow-xl backdrop-blur lg:flex">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">
                StayKha Admin
              </p>
              <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-foreground">
                StayKha, distilled.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Track readings, manage tenants, and issue invoices with a calm,
                data-dense workflow built for daily ops.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Real-time occupancy and billing insights
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Smart meter reading capture with OCR
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Export-ready invoices and audit trails
              </div>
            </div>
          </div>

          <Card className="w-full max-w-md justify-self-center border-border/60 bg-card/90 shadow-2xl backdrop-blur">
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <Gauge className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                StayKha
              </CardTitle>
              <CardDescription>
                Enter your credentials to access the admin portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
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
                    Password
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <div className="mt-4 flex items-center justify-between text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
                <div>
                  <span className="text-muted-foreground">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign up
                  </Link>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-center text-sm font-medium text-muted-foreground">
                  Demo Accounts:
                </p>
                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("owner@example.com", "owner123")}
                    className="w-full justify-start text-left"
                    type="button"
                  >
                    <span className="flex-1">Owner - Full Access</span>
                    <span className="text-xs text-muted-foreground">
                      owner@example.com
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("admin@example.com", "admin123")}
                    className="w-full justify-start text-left"
                    type="button"
                  >
                    <span className="flex-1">Admin - Manager Access</span>
                    <span className="text-xs text-muted-foreground">
                      admin@example.com
                    </span>
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Password: password123, owner123, or admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
