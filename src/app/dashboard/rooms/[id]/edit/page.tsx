"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TenantInlineForm } from "@/components/rooms/tenant-inline-form";
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
import { buildingsApi, roomsApi, tenantsApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import { mapZodErrors, roomFormSchema, tenantDraftSchema } from "@/lib/schemas";
import type { RoomFormValues, TenantDraft } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function EditRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  usePageTitle(`แก้ไขห้อง ${roomId}`);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<RoomFormValues>({
    roomNumber: "",
    buildingId: "",
    floor: "1",
    status: "vacant",
    monthlyRent: "",
    size: "",
  });
  const [assignTenantNow, setAssignTenantNow] = React.useState(false);
  const [tenantData, setTenantData] = React.useState<TenantDraft>({
    name: "",
    email: "",
    phone: "",
    moveInDate: new Date().toISOString().split("T")[0],
    deposit: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [tenantErrors, setTenantErrors] = React.useState<
    Record<string, string>
  >({});

  const roomQuery = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => roomsApi.getById(roomId),
    enabled: Boolean(roomId),
  });
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const buildings = buildingsQuery.data?.buildings ?? [];

  React.useEffect(() => {
    if (roomQuery.data?.room) {
      const room = roomQuery.data.room;
      setFormData({
        roomNumber: room.roomNumber,
        buildingId: room.buildingId,
        floor: String(room.floor),
        status: room.status,
        monthlyRent: room.monthlyRent ? String(room.monthlyRent) : "",
        size: room.size ? String(room.size) : "",
      });
    }
  }, [roomQuery.data]);

  const updateRoomMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      updates: {
        roomNumber: string;
        buildingId: string;
        floor: number;
        status: string;
      };
    }) => roomsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
  const createTenantMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      phone: string;
      moveInDate: string;
      deposit: number;
      roomId: string;
      monthlyRent: number;
      status: "active";
    }) => tenantsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  if (roomQuery.isLoading || buildingsQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดข้อมูลห้อง..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomResult = roomFormSchema.safeParse(formData);
      if (!roomResult.success) {
        setErrors(mapZodErrors(roomResult.error));
        setTenantErrors({});
        setLoading(false);
        return;
      }
      if (assignTenantNow) {
        const tenantResult = tenantDraftSchema.safeParse(tenantData);
        if (!tenantResult.success) {
          setTenantErrors(mapZodErrors(tenantResult.error));
          setLoading(false);
          return;
        }
      }
      setErrors({});
      setTenantErrors({});

      await updateRoomMutation.mutateAsync({
        id: roomId,
        updates: {
          roomNumber: formData.roomNumber,
          buildingId: formData.buildingId,
          floor: Number.parseInt(formData.floor, 10),
          status: formData.status,
          monthlyRent: formData.monthlyRent
            ? Number.parseFloat(formData.monthlyRent)
            : undefined,
          size: formData.size ? Number.parseFloat(formData.size) : undefined,
        },
      });
      if (assignTenantNow && roomQuery.data?.room?.status !== "occupied") {
        await createTenantMutation.mutateAsync({
          name: tenantData.name,
          email: tenantData.email,
          phone: tenantData.phone,
          moveInDate: tenantData.moveInDate,
          deposit: tenantData.deposit
            ? Number.parseFloat(tenantData.deposit)
            : 0,
          roomId,
          monthlyRent: formData.monthlyRent
            ? Number.parseFloat(formData.monthlyRent)
            : 0,
          status: "active",
        });
      }
      router.push("/overview/rooms");
    } catch (error) {
      console.error("Failed to update room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="แก้ไขห้อง" description="อัปเดตข้อมูลห้อง" showBack />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลห้อง</CardTitle>
          <CardDescription>อัปเดตรายละเอียดห้อง</CardDescription>
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

            {roomQuery.data?.room?.status !== "occupied" && (
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">ผูกผู้เช่าตอนนี้</p>
                    <p className="text-xs text-muted-foreground">
                      สร้างผู้เช่าและผูกกับห้องนี้ทันที
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={assignTenantNow ? "default" : "outline"}
                    onClick={() => setAssignTenantNow((prev) => !prev)}
                  >
                    {assignTenantNow ? "เปิดใช้งาน" : "เพิ่มผู้เช่า"}
                  </Button>
                </div>
                {assignTenantNow && (
                  <TenantInlineForm
                    value={tenantData}
                    onChange={setTenantData}
                    showDeposit
                    errors={tenantErrors}
                    disabled={loading}
                  />
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
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
