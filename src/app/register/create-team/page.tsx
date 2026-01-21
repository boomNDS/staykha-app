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
import { teamsApi, usersApi } from "@/lib/api-client";
import { getData } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

export default function CreateTeamPage() {
  usePageTitle("สร้างทีมของคุณ");

  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Redirect if not owner or already has team
    if (user && (user.role !== "owner" || user.teamId)) {
      router.push("/overview");
    }
  }, [user, router]);

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
      // Create team
      const team = getData(await teamsApi.create({ name: teamName.trim() }));
      if (!team) {
        throw new Error("ไม่พบข้อมูลทีมที่สร้าง");
      }

      const updated = getData(
        await usersApi.update(user.id, { teamId: team.id }),
      );
      const updatedUser = {
        ...user,
        ...(updated ?? {}),
        teamId: team.id,
        team,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Trigger auth context update
      window.dispatchEvent(new Event("userUpdated"));

      toast({
        title: "สร้างทีมสำเร็จ",
        description: `ยินดีต้อนรับสู่ ${team.name}! ขั้นต่อไปคือสร้างอาคารและเพิ่มห้อง`,
      });

      // Redirect to buildings to start the owner flow
      router.push("/overview/buildings/new");
    } catch (error: any) {
      logError(error, {
        scope: "teams",
        action: "create",
        metadata: { userId: user?.id },
      });
      setError(getErrorMessage(error, "ไม่สามารถสร้างทีมได้ กรุณาลองใหม่อีกครั้ง"));
      toast({
        title: "เกิดข้อผิดพลาด",
        description: getErrorMessage(error, "ไม่สามารถสร้างทีมได้"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
