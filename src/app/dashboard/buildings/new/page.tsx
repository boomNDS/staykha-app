"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { AdminRestrictionBanner } from "@/components/admin-restriction-banner";
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
import { useToast } from "@/hooks/use-toast";
import { buildingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { usePageTitle } from "@/lib/use-page-title";

export default function NewBuildingPage() {
  usePageTitle("เพิ่มอาคารใหม่");

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Show restriction banner for admins
  if (user?.role !== "owner") {
    return (
      <div className="space-y-6">
        <PageHeader title="เพิ่มอาคารใหม่" description="สร้างอาคารใหม่" showBack />
        <AdminRestrictionBanner
          title="ต้องให้เจ้าของดำเนินการ"
          message="เฉพาะเจ้าของเท่านั้นที่สามารถสร้างอาคารได้ โปรดติดต่อเจ้าของทีมเพื่อสร้างอาคารก่อน"
          action="เมื่อมีอาคารแล้ว คุณสามารถสร้างห้องและจัดการผู้เช่าได้"
        />
      </div>
    );
  }
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    totalFloors: "",
    totalRooms: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "กรุณากรอกชื่ออาคาร";
    if (!formData.address.trim()) newErrors.address = "กรุณากรอกที่อยู่";
    if (
      !formData.totalFloors ||
      Number.parseInt(formData.totalFloors, 10) < 1
    ) {
      newErrors.totalFloors = "ต้องมีอย่างน้อย 1 ชั้น";
    }
    if (!formData.totalRooms || Number.parseInt(formData.totalRooms, 10) < 1) {
      newErrors.totalRooms = "ต้องมีอย่างน้อย 1 ห้อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createBuildingMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      address: string;
      totalFloors: number;
      totalRooms: number;
      ownerId: string;
    }) => buildingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await createBuildingMutation.mutateAsync({
        ...formData,
        totalFloors: Number.parseInt(formData.totalFloors, 10),
        totalRooms: Number.parseInt(formData.totalRooms, 10),
        ownerId: user?.id || "",
      });

      toast({
        title: "สำเร็จ",
        description: "สร้างอาคารเรียบร้อย",
      });

      router.push("/overview/buildings");
    } catch (error) {
      logError(error, {
        scope: "buildings",
        action: "create",
        metadata: { ownerId: user?.id },
      });
      toast({
        title: "เกิดข้อผิดพลาด",
        description: getErrorMessage(error, "สร้างอาคารไม่สำเร็จ"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="เพิ่มอาคารใหม่" description="สร้างอาคารใหม่" showBack />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>ข้อมูลอาคาร</CardTitle>
          <CardDescription>กรอกรายละเอียดอาคาร</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                ชื่ออาคาร
              </label>
              <Input
                id="name"
                placeholder="เช่น อาคาร A"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                ที่อยู่
              </label>
              <Input
                id="address"
                placeholder="เช่น 123 ถนนสุขุมวิท กรุงเทพฯ 10110"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="totalFloors" className="text-sm font-medium">
                  จำนวนชั้น
                </label>
                <Input
                  id="totalFloors"
                  type="number"
                  min="1"
                  placeholder="เช่น 3"
                  value={formData.totalFloors}
                  onChange={(e) =>
                    setFormData({ ...formData, totalFloors: e.target.value })
                  }
                  disabled={isLoading}
                />
                {errors.totalFloors && (
                  <p className="text-sm text-destructive">
                    {errors.totalFloors}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="totalRooms" className="text-sm font-medium">
                  จำนวนห้อง
                </label>
                <Input
                  id="totalRooms"
                  type="number"
                  min="1"
                  placeholder="เช่น 15"
                  value={formData.totalRooms}
                  onChange={(e) =>
                    setFormData({ ...formData, totalRooms: e.target.value })
                  }
                  disabled={isLoading}
                />
                {errors.totalRooms && (
                  <p className="text-sm text-destructive">
                    {errors.totalRooms}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  "สร้างอาคาร"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
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
