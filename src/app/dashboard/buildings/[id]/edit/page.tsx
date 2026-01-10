"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { buildingsApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import type { Building } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function EditBuildingPage() {
  const params = useParams();
  const buildingId = params.id as string;
  usePageTitle(`แก้ไขอาคาร ${buildingId}`);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    totalFloors: "",
    totalRooms: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const buildingQuery = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => buildingsApi.getById(buildingId),
    enabled: Boolean(buildingId),
  });

  React.useEffect(() => {
    if (buildingQuery.data?.building) {
      const building: Building = buildingQuery.data.building;
      setFormData({
        name: building.name,
        address: building.address,
        totalFloors: building.totalFloors.toString(),
        totalRooms: building.totalRooms.toString(),
      });
    }
  }, [buildingQuery.data]);

  const updateBuildingMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Building> }) =>
      buildingsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await updateBuildingMutation.mutateAsync({
        id: buildingId,
        updates: {
          ...formData,
          totalFloors: Number.parseInt(formData.totalFloors, 10),
          totalRooms: Number.parseInt(formData.totalRooms, 10),
        },
      });

      toast({
        title: "สำเร็จ",
        description: "อัปเดตอาคารเรียบร้อย",
      });

      router.push("/overview/buildings");
    } catch (_error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "อัปเดตอาคารไม่สำเร็จ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (buildingQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดอาคาร..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="แก้ไขอาคาร"
        description="อัปเดตข้อมูลอาคาร"
        showBack
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>ข้อมูลอาคาร</CardTitle>
          <CardDescription>
            แก้ไขรายละเอียดของอาคารนี้
          </CardDescription>
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
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกการแก้ไข"
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
