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
import { invitationsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

export default function JoinTeamPage() {
  usePageTitle("เข้าร่วมทีม");

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Redirect if not admin or already has team
    if (user && (user.role !== "admin" || user.teamId)) {
      router.push("/overview");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inviteCode.trim()) {
      setError("กรุณากรอกโค้ดคำเชิญ");
      return;
    }

    if (!user) {
      setError("คุณต้อง Sign in ก่อนเข้าร่วมทีม");
      return;
    }

    setIsLoading(true);

    try {
      // Accept invitation by code
      const { team } = await invitationsApi.acceptByCode(
        inviteCode.trim().toUpperCase(),
        user.id,
      );

      // Update user in context and localStorage
      const updatedUser = { ...user, teamId: team.id, team };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Trigger auth context update
      window.dispatchEvent(new Event("userUpdated"));

      toast({
        title: "เข้าร่วมทีมสำเร็จ",
        description: `Welcome to ${team.name}!`,
      });

      router.push("/overview");
    } catch (error: any) {
      console.error("[Join Team] Error:", error);
      setError(error.message || "โค้ดคำเชิญไม่ถูกต้องหรือหมดอายุ");
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "โค้ดคำเชิญไม่ถูกต้อง",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== "admin") {
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
            เข้าร่วมทีม
          </CardTitle>
          <CardDescription>
            กรอกโค้ดคำเชิญที่ได้รับจากเจ้าของทีมเพื่อเข้าร่วมองค์กร
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="inviteCode"
                className="text-sm font-medium text-foreground"
              >
                โค้ดคำเชิญ
              </label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="INV-XXXXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                รูปแบบโค้ดคำเชิญเช่น: INV-XXXXXX
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าร่วมทีม...
                </>
              ) : (
                "เข้าร่วมทีม"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
