"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Calculator, Wand2 } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { buildingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { getData, getList } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-hooks";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { bulkRoomSchema, mapZodErrors } from "@/lib/schemas";
import type { BulkRoomFormValues } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function BulkRoomPage() {
  usePageTitle("เพิ่มห้องแบบหลายรายการ");

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
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
  const buildings = getList(buildingsQuery.data);

  const [formData, setFormData] = React.useState<BulkRoomFormValues>({
    buildingId: "",
    floorStart: "1",
    floorEnd: "1",
    roomsPerFloor: "6",
    startIndex: "1",
    status: "vacant",
    monthlyRent: "",
    size: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const settings = getData(settingsQuery.data);

  if (buildingsQuery.isSuccess && buildings.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
        title="ต้องสร้างอาคารก่อนเพิ่มห้อง"
        description="ยังไม่มีอาคารในระบบ กรุณาสร้างอาคารก่อนเพื่อเพิ่มห้อง"
        actionLabel="สร้างอาคาร"
        actionHref="/overview/buildings/new"
        variant="page"
      />
    );
  }

  React.useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        monthlyRent: prev.monthlyRent || String(settings.defaultRoomRent ?? ""),
        size: prev.size || String(settings.defaultRoomSize ?? ""),
      }));
    }
  }, [settings]);

  const bulkCreateMutation = useMutation({
    mutationFn: (payload: {
      buildingId: string;
      floorStart: number;
      floorEnd: number;
      roomsPerFloor: number;
      startIndex: number;
      status: "occupied" | "vacant" | "maintenance";
      monthlyRent?: number;
      size?: number;
    }) =>
      roomsApi.bulkCreate({
        ...payload,
        status: payload.status
          ? (payload.status.toUpperCase() as "OCCUPIED" | "VACANT" | "MAINTENANCE")
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const parsedFloorStart = Number.parseInt(formData.floorStart, 10);
  const parsedFloorEnd = Number.parseInt(formData.floorEnd, 10);
  const parsedRoomsPerFloor = Number.parseInt(formData.roomsPerFloor, 10);
  const parsedStartIndex = Number.parseInt(formData.startIndex, 10);
  const isPreviewValid =
    Number.isInteger(parsedFloorStart) &&
    Number.isInteger(parsedFloorEnd) &&
    Number.isInteger(parsedRoomsPerFloor) &&
    Number.isInteger(parsedStartIndex) &&
    parsedFloorEnd >= parsedFloorStart;
  const totalRooms = isPreviewValid
    ? (parsedFloorEnd - parsedFloorStart + 1) * parsedRoomsPerFloor
    : 0;
  const sampleRoom =
    isPreviewValid && totalRooms > 0
      ? `${parsedFloorStart}${String(parsedStartIndex).padStart(2, "0")}`
      : "—";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = bulkRoomSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      setIsSubmitting(false);
      return;
    }
    setErrors({});

    try {
      const response = await bulkCreateMutation.mutateAsync({
        buildingId: formData.buildingId,
        floorStart: Number.parseInt(formData.floorStart, 10),
        floorEnd: Number.parseInt(formData.floorEnd, 10),
        roomsPerFloor: Number.parseInt(formData.roomsPerFloor, 10),
        startIndex: Number.parseInt(formData.startIndex, 10),
        status: formData.status,
        monthlyRent: formData.monthlyRent
          ? Number.parseFloat(formData.monthlyRent)
          : undefined,
        size: formData.size ? Number.parseFloat(formData.size) : undefined,
      });
      const result = getData(response);
      if (!result) {
        throw new Error("Invalid bulk create response");
      }
      toast({
        title: "สร้างห้องเรียบร้อย",
        description:
          result.skippedRooms.length > 0
            ? `สร้างห้อง ${result.createdCount} ห้อง ข้ามข้อมูลซ้ำ ${result.skippedRooms.length} รายการ`
            : `สร้างห้อง ${result.createdCount} ห้อง`,
      });
      router.push("/overview/rooms");
    } catch (error: any) {
      logError(error, {
        scope: "rooms",
        action: "bulk-create",
        metadata: { buildingId: formData.buildingId },
      });
      toast({
        title: "สร้างห้องแบบหลายรายการไม่สำเร็จ",
        description: getErrorMessage(error, "สร้างห้องไม่สำเร็จ"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="เพิ่มห้องแบบหลายรายการ"
        description="สร้างห้องตามชั้นพร้อมเลขห้องอัตโนมัติ"
        showBack
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>สร้างห้องแบบอัตโนมัติ</CardTitle>
            <CardDescription>ระบบจะสร้างห้องให้ทุกชั้นตามช่วงที่กำหนด</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buildingId">อาคาร *</Label>
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, buildingId: value })
                    }
                  >
                    <SelectTrigger
                      id="buildingId"
                      className={errors.buildingId ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="เลือกอาคาร" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.buildingId && (
                    <p className="text-sm text-destructive">
                      {errors.buildingId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">สถานะเริ่มต้น</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "occupied" | "vacant" | "maintenance") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">ว่าง</SelectItem>
                      <SelectItem value="occupied">เข้าพัก</SelectItem>
                      <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floorStart">ชั้นเริ่มต้น *</Label>
                  <Input
                    id="floorStart"
                    type="number"
                    min="1"
                    value={formData.floorStart}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        floorStart: event.target.value,
                      })
                    }
                    className={errors.floorStart ? "border-destructive" : ""}
                  />
                  {errors.floorStart && (
                    <p className="text-sm text-destructive">
                      {errors.floorStart}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floorEnd">ชั้นสิ้นสุด *</Label>
                  <Input
                    id="floorEnd"
                    type="number"
                    min="1"
                    value={formData.floorEnd}
                    onChange={(event) =>
                      setFormData({ ...formData, floorEnd: event.target.value })
                    }
                    className={errors.floorEnd ? "border-destructive" : ""}
                  />
                  {errors.floorEnd && (
                    <p className="text-sm text-destructive">
                      {errors.floorEnd}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomsPerFloor">จำนวนห้องต่อชั้น *</Label>
                  <Input
                    id="roomsPerFloor"
                    type="number"
                    min="1"
                    value={formData.roomsPerFloor}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        roomsPerFloor: event.target.value,
                      })
                    }
                    className={errors.roomsPerFloor ? "border-destructive" : ""}
                  />
                  {errors.roomsPerFloor && (
                    <p className="text-sm text-destructive">
                      {errors.roomsPerFloor}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startIndex">เลขห้องเริ่มต้น *</Label>
                  <Input
                    id="startIndex"
                    type="number"
                    min="1"
                    value={formData.startIndex}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        startIndex: event.target.value,
                      })
                    }
                    className={errors.startIndex ? "border-destructive" : ""}
                  />
                  {errors.startIndex && (
                    <p className="text-sm text-destructive">
                      {errors.startIndex}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">ขนาดห้อง (ตร.ม.)</Label>
                  <Input
                    id="size"
                    type="number"
                    min="0"
                    value={formData.size}
                    onChange={(event) =>
                      setFormData({ ...formData, size: event.target.value })
                    }
                    className={errors.size ? "border-destructive" : ""}
                  />
                  {errors.size && (
                    <p className="text-sm text-destructive">{errors.size}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">ค่าเช่ารายเดือน (บาท)</Label>
                  <Input
                    id="monthlyRent"
                    type="number"
                    min="0"
                    value={formData.monthlyRent}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        monthlyRent: event.target.value,
                      })
                    }
                    className={errors.monthlyRent ? "border-destructive" : ""}
                  />
                  {errors.monthlyRent && (
                    <p className="text-sm text-destructive">
                      {errors.monthlyRent}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isSubmitting ? "กำลังสร้าง..." : "สร้างห้อง"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              ตัวอย่าง
            </CardTitle>
            <CardDescription>ตรวจสอบข้อมูลก่อนสร้างห้อง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">จำนวนห้องที่จะถูกสร้าง</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {totalRooms}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">ตัวอย่างเลขห้อง</p>
              <p className="mt-2 font-semibold text-foreground">{sampleRoom}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                รูปแบบ: ชั้น + เลขสองหลัก (เช่น 201, 202, 203)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
