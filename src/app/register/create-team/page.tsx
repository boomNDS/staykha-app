"use client";

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
import { LoadingState } from "@/components/loading-state";
import { useToast } from "@/hooks/use-toast";
import { teamsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

export default function CreateTeamPage() {
  usePageTitle("Create Your Team");

  const router = useRouter();
  const { toast } = useToast();
  const { user, login } = useAuth();
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
      setError("Team name is required");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a team");
      return;
    }

    setIsLoading(true);

    try {
      // Create team
      const { team } = await teamsApi.create({ name: teamName.trim() });

      // Update user with teamId using PocketBase API
      const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await fetch(`${pocketbaseUrl}/api/collections/users/records/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId: team.id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user with team");
      }

      // Update user in context and localStorage
      const updatedUser = { ...user, teamId: team.id, team };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Trigger auth context update
      window.dispatchEvent(new Event("userUpdated"));

      toast({
        title: "Team created successfully",
        description: `Welcome to ${team.name}! You can now create buildings.`,
      });

      router.push("/overview");
    } catch (error: any) {
      console.error("[Create Team] Error:", error);
      setError(error.message || "Failed to create team. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== "owner") {
    return <LoadingState fullScreen message="Loading..." />;
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
            Create Your Team
          </CardTitle>
          <CardDescription>
            As an owner, you need to create a team to get started. This will be your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="teamName"
                className="text-sm font-medium text-foreground"
              >
                Team/Organization Name
              </label>
              <Input
                id="teamName"
                type="text"
                placeholder="My Property Management"
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
                  Creating team...
                </>
              ) : (
                "Create Team"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
