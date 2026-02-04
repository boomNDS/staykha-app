"use client";

import { Gauge, Loader2 } from "lucide-react";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
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
import { authApi, teamsApi } from "@/lib/api-client";
import { getData } from "@/lib/api/response-helpers";
import { useAuth, useSetUser } from "@/lib/auth-hooks";
import { normalizeErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

export default function CreateTeamPage() {
  usePageTitle("สร้างทีมของคุณ");

  const router = useRouter();
  const { toast } = useToast();
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const setUser = useSetUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthLoading && !user) {
      router.push("/login");
      return;
    }
    
    // Redirect if not owner
    if (user && user.role !== "owner") {
      router.push("/overview");
      return;
    }
    
    // Redirect if already has team
    if (user && user.teamId) {
      router.push("/overview");
    }
  }, [user, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!teamName.trim()) {
      setError("กรุณากรอกชื่อทีม");
      return;
    }

    if (!user) {
      setError("คุณต้อง Sign in ก่อนจึงจะสร้างทีมได้");
      return;
    }

    setIsLoading(true);

    try {
      // Backend should automatically assign team to the user
      const response = await teamsApi.create({ name: teamName.trim() });
      const team = getData(response);
      if (!team || !team.id) {
        throw new Error("ไม่พบข้อมูลทีมที่สร้าง");
      }

      // Fetch fresh user data from /auth/me to get updated team info
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const meResponse = await authApi.getMe(token);
          if (meResponse.user) {
            setUser(meResponse.user);
            localStorage.setItem("user", JSON.stringify(meResponse.user));
          } else {
            // Fallback: update user state with team info
            const updatedUser = { ...user, teamId: team.id, team };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          // Fallback: update user state with team info
          console.warn("[Create Team] Failed to fetch user, using team info:", error);
          const updatedUser = { ...user, teamId: team.id, team };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }

      toast({
        title: "สร้างทีมสำเร็จ",
        description: `ยินดีต้อนรับสู่ ${team.name}! ขั้นต่อไปคือสร้างอาคารและเพิ่มห้อง`,
      });

      // Redirect immediately - don't wait for state propagation
      router.push("/overview/buildings/new");
    } catch (error: any) {
      logError(error, {
        scope: "teams",
        action: "create",
        metadata: { userId: user?.id },
      });
      const errorMessage = normalizeErrorMessage(
        error,
        "ไม่สามารถสร้างทีมได้ กรุณาลองใหม่อีกครั้ง",
      );
      setError(errorMessage);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (isAuthLoading) {
    return <LoadingState fullScreen message="กำลังโหลด..." />;
  }

  // Redirect handled in useEffect, but show loading as fallback
  if (!user || user.role !== "owner") {
    return <LoadingState fullScreen message="กำลังโหลด..." />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_55%)]" />
      <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Gauge className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
            สร้างทีมของคุณ
          </CardTitle>
          <CardDescription>
            ในฐานะเจ้าของ คุณต้องสร้างทีมเพื่อเริ่มต้นใช้งาน ทีมนี้จะเป็นองค์กรของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="teamName"
                className="text-sm font-medium text-foreground"
              >
                ชื่อทีม/องค์กร
              </label>
              <Input
                id="teamName"
                type="text"
                placeholder="ทีมบริหารหอพักของฉัน"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสร้างทีม...
                </>
              ) : (
                "สร้างทีม"
              )}
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-center">
            <Button variant="ghost" size="sm" onClick={logout}>
              ออกจากระบบ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
