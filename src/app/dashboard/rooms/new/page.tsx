"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { SettingsRequired } from "@/components/settings-required";
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
import { buildingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { mapZodErrors, roomFormSchema } from "@/lib/schemas";
import type { RoomFormValues } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function NewRoomPage() {
  usePageTitle("เพิ่มห้องใหม่");

  const router = useRouter();
  const { user } = useAuth();
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
  const buildings = buildingsQuery.data?.buildings ?? [];
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<RoomFormValues>({
    roomNumber: "",
    buildingId: "",
    floor: "1",
    status: "vacant",
    monthlyRent: "",
    size: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const settings = settingsQuery.data?.settings;
  
  // Show settings required message if settings don't exist
  if (settingsQuery.isSuccess && !settings) {
    return (
      <SettingsRequired
        title="ต้องตั้งค่า Settings ก่อนใช้งาน"
        description="คุณต้องสร้าง Settings ของทีมก่อนจึงจะเพิ่มห้องได้"
      />
    );
  }
  
  React.useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        monthlyRent:
          prev.monthlyRent ||
          String(settings.defaultRoomRent ?? ""),
        size:
          prev.size ||
          String(settings.defaultRoomSize ?? ""),
      }));
    }
  }, [settings]);

  const createRoomMutation = useMutation({
    mutationFn: (payload: {
      roomNumber: string;
      buildingId: string;
      floor: number;
      status: "occupied" | "vacant" | "maintenance";
      monthlyRent?: number;
      size?: number;
    }) => roomsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomResult = roomFormSchema.safeParse(formData);
      if (!roomResult.success) {
        setErrors(mapZodErrors(roomResult.error));
        setLoading(false);
        return;
      }
      setErrors({});

      await createRoomMutation.mutateAsync({
        roomNumber: formData.roomNumber,
        buildingId: formData.buildingId,
        floor: Number.parseInt(formData.floor, 10),
        status: formData.status as "occupied" | "vacant" | "maintenance",
        monthlyRent: formData.monthlyRent
          ? Number.parseFloat(formData.monthlyRent)
          : undefined,
        size: formData.size ? Number.parseFloat(formData.size) : undefined,
      });
      router.push("/overview/rooms");
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="เพิ่มห้องใหม่"
        description="สร้างห้องใหม่ในระบบ"
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลห้อง</CardTitle>
          <CardDescription>
            กรอกรายละเอียดห้องใหม่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">เลขห้อง *</Label>
                <Input
                  id="roomNumber"
                  required
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                  placeholder="101"
                />
                {errors.roomNumber && (
                  <p className="text-sm text-destructive">
                    {errors.roomNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingName">อาคาร *</Label>
                <Select
                  value={formData.buildingId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, buildingId: value })
                  }
                >
                  <SelectTrigger id="buildingName">
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
                <Label htmlFor="floor">ชั้น *</Label>
                <Input
                  id="floor"
                  type="number"
                  required
                  min="1"
                  value={formData.floor}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: e.target.value })
                  }
                />
                {errors.floor && (
                  <p className="text-sm text-destructive">{errors.floor}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">สถานะ</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
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
                <Label htmlFor="size">ขนาดห้อง (ตร.ม.)</Label>
                <Input
                  id="size"
                  type="number"
                  min="0"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
                {errors.size && (
                  <p className="text-sm text-destructive">{errors.size}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">ค่าเช่ารายเดือน</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  min="0"
                  value={formData.monthlyRent}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRent: e.target.value })
                  }
                />
                {errors.monthlyRent && (
                  <p className="text-sm text-destructive">
                    {errors.monthlyRent}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "กำลังสร้าง..." : "สร้างห้อง"}
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
    </div>
  );
}
