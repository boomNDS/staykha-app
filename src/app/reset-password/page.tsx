"use client";

import { Link, useSearch } from "@tanstack/react-router";
import { Gauge, Loader2, Lock } from "lucide-react";
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
import { mapZodErrors, resetPasswordSchema } from "@/lib/schemas";
import { usePageTitle } from "@/lib/use-page-title";

export default function ResetPasswordPage() {
  usePageTitle("Reset Password");

  const router = useRouter();
  const search = useSearch({ from: "/reset-password" }) as { token?: string };
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const token = React.useMemo(() => {
    // Get token from URL search params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("token") || search?.token || "";
    }
    return search?.token || "";
  }, [search]);

  React.useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid reset link",
        description:
          "The reset link is missing or invalid. Please request a new one.",
        variant: "destructive",
      });
      router.push("/forgot-password");
    }
  }, [token, router, toast]);

  const validateForm = () => {
    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.confirmPasswordReset(
        token,
        formData.password,
        formData.passwordConfirm,
      );
      setIsSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now sign in.",
      });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Failed to reset password",
        description:
          error.message ||
          "The reset link may have expired. Please request a new one.",
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
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Password Reset Successful
            </CardTitle>
            <CardDescription>
              Your password has been reset successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Redirecting you to the sign in page...
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return null;
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
              StayKha Admin
            </p>
            <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Set New Password
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Enter your new password below. Make sure it's at least 6
              characters long.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Use a strong, unique password
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Minimum 6 characters required
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Keep your password secure
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md justify-self-center border-border/60 bg-card/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Lock className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              Reset Password
            </CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  New Password
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
                  Confirm Password
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Remember your password?{" "}
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
