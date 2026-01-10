"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
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
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import { mapZodErrors, tenantFormSchema } from "@/lib/schemas";
import type { Room } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function EditTenantPage() {
  const params = useParams();
  const tenantId = params.id as string;
  usePageTitle(`แก้ไขผู้เช่า ${tenantId}`);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    roomId: "",
    moveInDate: "",
    contractEndDate: "",
    monthlyRent: "",
    deposit: "",
    idCardNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    status: "active",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const tenantQuery = useQuery({
    queryKey: ["tenants", tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: Boolean(tenantId),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const rooms = (roomsQuery.data?.rooms ?? []).filter(
    (room: Room) =>
      room.status === "vacant" || room.id === tenantQuery.data?.tenant?.roomId,
  );

  React.useEffect(() => {
    if (tenantQuery.data?.tenant) {
      const tenant = tenantQuery.data.tenant;
      setFormData({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        roomId: tenant.roomId || "",
        moveInDate: tenant.moveInDate,
        contractEndDate: tenant.contractEndDate ?? "",
        monthlyRent: tenant.monthlyRent?.toString() ?? "",
        deposit: tenant.deposit?.toString() ?? "",
        idCardNumber: tenant.idCardNumber ?? "",
        emergencyContact: tenant.emergencyContact ?? "",
        emergencyPhone: tenant.emergencyPhone ?? "",
        status: tenant.status,
      });
    }
  }, [tenantQuery.data]);

  const updateTenantMutation = useMutation({
    mutationFn: (payload: { id: string; updates: typeof formData }) =>
      tenantsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  if (tenantQuery.isLoading || roomsQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดผู้เช่า..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = tenantFormSchema.safeParse(formData);
    if (!result.success) {
      setErrors(mapZodErrors(result.error));
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await updateTenantMutation.mutateAsync({
        id: tenantId,
        updates: {
          ...formData,
          monthlyRent: Number.parseFloat(formData.monthlyRent || "0"),
          deposit: Number.parseFloat(formData.deposit || "0"),
        },
      });
      router.push("/overview/tenants");
    } catch (error) {
      console.error("Failed to update tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="แก้ไขผู้เช่า" description="อัปเดตข้อมูลผู้เช่า" showBack />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลผู้เช่า</CardTitle>
          <CardDescription>อัปเดตรายละเอียดผู้เช่า</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">ผูกห้อง *</Label>
                <Select
                  value={formData.roomId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, roomId: value })
                  }
                >
                  <SelectTrigger
                    id="roomId"
                    className={errors.roomId ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="เลือกห้อง" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomNumber} - {room.buildingName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.roomId && (
                  <p className="text-sm text-destructive">{errors.roomId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveInDate">วันที่ย้ายเข้า *</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  required
                  value={formData.moveInDate}
                  onChange={(e) =>
                    setFormData({ ...formData, moveInDate: e.target.value })
                  }
                  className={errors.moveInDate ? "border-destructive" : ""}
                />
                {errors.moveInDate && (
                  <p className="text-sm text-destructive">
                    {errors.moveInDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEndDate">วันสิ้นสุดสัญญา</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contractEndDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyRent">ค่าเช่ารายเดือน (บาท)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyRent: e.target.value })
                  }
                  className={errors.monthlyRent ? "border-destructive" : ""}
                />
                {errors.monthlyRent && (
                  <p className="text-sm text-destructive">
                    {errors.monthlyRent}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit">เงินประกัน (บาท)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit: e.target.value })
                  }
                  className={errors.deposit ? "border-destructive" : ""}
                />
                {errors.deposit && (
                  <p className="text-sm text-destructive">{errors.deposit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardNumber">เลขบัตรประชาชน</Label>
                <Input
                  id="idCardNumber"
                  value={formData.idCardNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, idCardNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">ชื่อผู้ติดต่อฉุกเฉิน</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">เบอร์ผู้ติดต่อฉุกเฉิน</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                />
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
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                    <SelectItem value="expired">หมดอายุ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
