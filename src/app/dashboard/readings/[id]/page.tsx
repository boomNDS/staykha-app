"use client";

import { useQuery } from "@tanstack/react-query";
import { Droplets, Zap } from "lucide-react";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { ReadingForm } from "@/components/readings/reading-form";
import { SettingsRequired } from "@/components/settings-required";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { readingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "@/lib/router";
import type { MeterReadingGroup } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function ReadingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const readingId = params.id as string;
  usePageTitle(`การอ่านมิเตอร์ ${readingId}`);

  const readingQuery = useQuery({
    queryKey: ["readings", readingId],
    queryFn: () => readingsApi.getById(readingId),
    enabled: Boolean(readingId),
  });
  const roomId = readingQuery.data?.reading?.roomId;
  const roomQuery = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => {
      if (!roomId) {
        throw new Error("Missing room id");
      }
      return roomsApi.getById(roomId);
    },
    enabled: Boolean(roomId),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("จำเป็นต้องมี Team ID เพื่อโหลด Settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });
  const [inlineMeter, setInlineMeter] = React.useState<"water" | "electric" | null>(
    null,
  );

  if (readingQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดการอ่านมิเตอร์..." />;
  }

  const reading = readingQuery.data?.reading as MeterReadingGroup | undefined;
  const room = roomQuery.data?.room;

  if (!reading) {
    return <div className="py-12 text-center">ไม่พบการอ่านมิเตอร์</div>;
  }

  const statusVariant =
    reading.status === "incomplete"
      ? "outline"
      : reading.status === "pending"
        ? "secondary"
        : "default";
  const settings = settingsQuery.data?.settings;

  // Show settings required message if settings don't exist
  if (settingsQuery.isSuccess && !settings) {
    return (
      <SettingsRequired
        title="ต้องตั้งค่า Settings ก่อนใช้งาน"
        description="คุณต้องสร้าง Settings ของทีมก่อนจึงจะดูรายละเอียดการอ่านได้"
      />
    );
  }

  const isWaterFixed = settings?.waterBillingMode === "fixed";
  const formattedReadingDate = (() => {
    const match = reading.readingDate.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const parsed = new Date(reading.readingDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return reading.readingDate;
  })();

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="การอ่านรายเดือน"
        description={`ห้อง ${reading.roomNumber} • ${new Date(reading.readingDate).toLocaleDateString("th-TH")}`}
        showBack
        actions={
          <Badge variant={statusVariant}>
            {reading.status === "pending"
              ? "รอออกบิล"
              : reading.status === "incomplete"
                ? "ไม่ครบ"
                : reading.status === "billed"
                  ? "ออกบิลแล้ว"
                  : reading.status === "paid"
                    ? "ชำระแล้ว"
                    : reading.status}
          </Badge>
        }
      />

      {inlineMeter ? (
        <ReadingForm
          initialRoomId={reading.roomId}
          initialDate={formattedReadingDate}
          initialMeterScope={inlineMeter}
          readingGroupId={reading.id}
          lockRoom
          lockDate
          lockMeterScope
          showCancel={false}
          onSuccess={() => setInlineMeter(null)}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>ผู้เช่าและห้อง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>ผู้เช่า</span>
            <span className="font-medium text-foreground">
              {reading.tenantName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>ห้อง</span>
            <span className="font-medium text-foreground">
              {room?.roomNumber || reading.roomNumber || reading.roomId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>อาคาร</span>
            <span className="font-medium text-foreground">
              {room?.buildingName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>ชั้น</span>
            <span className="font-medium text-foreground">
              {room?.floor ?? "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" /> มิเตอร์น้ำ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reading.water ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ก่อนหน้า</p>
                    <p className="font-semibold text-foreground">
                      {reading.water.previousReading} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ล่าสุด</p>
                    <p className="font-semibold text-foreground">
                      {reading.water.currentReading} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">การใช้</p>
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
                      alt="รูปมิเตอร์น้ำก่อนหน้า"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={reading.water.currentPhotoUrl}
                      alt="รูปมิเตอร์น้ำล่าสุด"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                </div>
              </>
            ) : isWaterFixed ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">ค่าน้ำคิดแบบเหมาจ่ายรายเดือน</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  ยังไม่มีการอ่านมิเตอร์น้ำสำหรับเดือนนี้
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setInlineMeter((prev) => (prev === "water" ? null : "water"))
                  }
                >
                  เพิ่มมิเตอร์น้ำ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> มิเตอร์ไฟ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reading.electric ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ก่อนหน้า</p>
                    <p className="font-semibold text-foreground">
                      {reading.electric.previousReading} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ล่าสุด</p>
                    <p className="font-semibold text-foreground">
                      {reading.electric.currentReading} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">การใช้</p>
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
                      alt="รูปมิเตอร์ไฟก่อนหน้า"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={reading.electric.currentPhotoUrl}
                      alt="รูปมิเตอร์ไฟล่าสุด"
                      className="h-36 w-full object-cover"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  ยังไม่มีการอ่านมิเตอร์ไฟสำหรับเดือนนี้
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    setInlineMeter((prev) =>
                      prev === "electric" ? null : "electric",
                    )
                  }
                >
                  เพิ่มมิเตอร์ไฟ
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
