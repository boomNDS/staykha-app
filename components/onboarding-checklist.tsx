"use client";

import {
  Building2,
  CheckCircle2,
  Circle,
  DoorOpen,
  Gauge,
  Users,
  X,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";

interface OnboardingChecklistProps {
  buildingsCount: number;
  roomsCount: number;
  tenantsCount: number;
  readingsCount: number;
}

const STORAGE_KEY = "staykha:onboardingChecklistHidden";

export function OnboardingChecklist({
  buildingsCount,
  roomsCount,
  tenantsCount,
  readingsCount,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setHidden(stored === "true");
  }, []);

  const steps = [
    {
      key: "building",
      title: "Add your first building",
      description: "Set address and floors to organize rooms.",
      done: buildingsCount > 0,
      action: () => router.push("/overview/buildings/new"),
      actionLabel: "Create building",
      icon: Building2,
      ownerOnly: true, // Only owners can create buildings
    },
    {
      key: "rooms",
      title: "Create rooms",
      description: "Add room numbers, floors, and rent.",
      done: roomsCount > 0,
      action: () => router.push("/overview/rooms/new"),
      actionLabel: "Add rooms",
      icon: DoorOpen,
    },
    {
      key: "tenants",
      title: "Assign tenants",
      description: "Link tenants to vacant rooms.",
      done: tenantsCount > 0,
      action: () => router.push("/overview/tenants/new"),
      actionLabel: "Add tenant",
      icon: Users,
    },
    {
      key: "readings",
      title: "Capture monthly readings",
      description: "Start water/electric readings for billing.",
      done: readingsCount > 0,
      action: () => router.push("/overview/readings/new"),
      actionLabel: "Add reading",
      icon: Gauge,
    },
  ];

  // Filter steps based on user role - admins can't see owner-only steps
  const visibleSteps = steps.filter((step) => {
    if (step.ownerOnly && user?.role !== "owner") {
      return false;
    }
    return true;
  });

  const completed = visibleSteps.filter((step) => step.done).length;
  const progress = Math.round((completed / visibleSteps.length) * 100);

  if (hidden || completed === visibleSteps.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">
            {user?.role === "owner" ? "Owner Setup Checklist" : "Setup Checklist"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the basics to start billing faster. {progress}% done.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "true");
            setHidden(true);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <div className="mt-0.5 text-primary">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                  {!step.done && (
                    <Button variant="outline" size="sm" onClick={step.action}>
                      {step.actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
