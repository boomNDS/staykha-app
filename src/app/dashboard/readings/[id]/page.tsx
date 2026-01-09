"use client";

import { useQuery } from "@tanstack/react-query";
import { Droplets, Zap } from "lucide-react";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { readingsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "@/lib/router";
import type { MeterReadingGroup } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function ReadingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const readingId = params.id as string;
  usePageTitle(`Reading ${readingId}`);

  const readingQuery = useQuery({
    queryKey: ["readings", readingId],
    queryFn: () => readingsApi.getById(readingId),
    enabled: Boolean(readingId),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("Team ID is required to load settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });

  if (readingQuery.isLoading) {
    return <LoadingState fullScreen message="Loading reading..." />;
  }

  const reading = readingQuery.data?.reading as MeterReadingGroup | undefined;

  if (!reading) {
    return <div className="text-center py-12">Reading not found</div>;
  }

  const statusVariant =
    reading.status === "incomplete"
      ? "outline"
      : reading.status === "pending"
        ? "secondary"
        : "default";
  const isWaterFixed =
    settingsQuery.data?.settings.waterBillingMode === "fixed";

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Monthly Readings"
        description={`Room ${reading.roomNumber} • ${new Date(reading.readingDate).toLocaleDateString()}`}
        showBack
        actions={<Badge variant={statusVariant}>{reading.status}</Badge>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tenant & Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Tenant</span>
            <span className="font-medium text-foreground">
              {reading.tenantName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Room</span>
            <span className="font-medium text-foreground">
              {reading.roomNumber || reading.roomId}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" /> Water Meter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reading.water ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Previous</p>
                    <p className="font-semibold text-foreground">
                      {reading.water.previousReading} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold text-foreground">
                      {reading.water.currentReading} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Consumption</p>
                    <p className="font-semibold text-foreground">
                      {reading.water.consumption} m³
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={reading.water.previousPhotoUrl}
                      alt="Previous water reading"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={reading.water.currentPhotoUrl}
                      alt="Current water reading"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                </div>
              </>
            ) : isWaterFixed ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Water is billed as a fixed monthly fee.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Water reading is missing for this month.
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/overview/readings/new?roomId=${reading.roomId}&date=${reading.readingDate}&meter=water`,
                    )
                  }
                >
                  Add Water Reading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Electric Meter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reading.electric ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Previous</p>
                    <p className="font-semibold text-foreground">
                      {reading.electric.previousReading} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold text-foreground">
                      {reading.electric.currentReading} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Consumption</p>
                    <p className="font-semibold text-foreground">
                      {reading.electric.consumption} kWh
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={reading.electric.previousPhotoUrl}
                      alt="Previous electric reading"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={reading.electric.currentPhotoUrl}
                      alt="Current electric reading"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Electric reading is missing for this month.
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/overview/readings/new?roomId=${reading.roomId}&date=${reading.readingDate}&meter=electric`,
                    )
                  }
                >
                  Add Electric Reading
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
