"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { buildingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-hooks";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { buildingFormSchema } from "@/lib/schemas";
import type { z } from "zod";
import { usePageTitle } from "@/lib/use-page-title";

type BuildingFormValues = z.infer<typeof buildingFormSchema>;

export default function NewBuildingPage() {
  usePageTitle("เพิ่มอาคารใหม่");

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Show restriction banner for admins
  if (user?.role !== "owner") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="เพิ่มอาคารใหม่"
          description="สร้างอาคารใหม่"
          showBack
        />
        <AdminRestrictionBanner
          title="ต้องให้เจ้าของดำเนินการ"
          message="เฉพาะเจ้าของเท่านั้นที่สามารถสร้างอาคารได้ โปรดติดต่อเจ้าของทีมเพื่อสร้างอาคารก่อน"
          action="เมื่อมีอาคารแล้ว คุณสามารถสร้างห้องและจัดการผู้เช่าได้"
        />
      </div>
    );
  }

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      name: "",
      address: "",
      totalFloors: "",
      totalRooms: "",
    },
  });

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

  const onSubmit = async (data: BuildingFormValues) => {
    try {
      await createBuildingMutation.mutateAsync({
        name: data.name,
        address: data.address,
        totalFloors: Number.parseInt(data.totalFloors, 10),
        totalRooms: Number.parseInt(data.totalRooms, 10),
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
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="เพิ่มอาคารใหม่"
        description="สร้างอาคารใหม่"
        showBack
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>ข้อมูลอาคาร</CardTitle>
          <CardDescription>กรอกรายละเอียดอาคาร</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่ออาคาร</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น อาคาร A"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="เช่น 123 ถนนสุขุมวิท กรุงเทพฯ 10110"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalFloors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนชั้น</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="เช่น 3"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalRooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนห้อง</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="เช่น 15"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
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
                  disabled={form.formState.isSubmitting}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
