"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
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
import { getData } from "@/lib/api/response-helpers";
import { useParams, useRouter } from "@/lib/router";
import { buildingFormSchema } from "@/lib/schemas";
import type { z } from "zod";
import { usePageTitle } from "@/lib/use-page-title";

type BuildingFormValues = z.infer<typeof buildingFormSchema>;

export default function EditBuildingPage() {
  const params = useParams();
  const buildingId = params.id as string;
  usePageTitle(`แก้ไขอาคาร ${buildingId}`);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const buildingQuery = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => buildingsApi.getById(buildingId),
    enabled: Boolean(buildingId),
  });

  // Buildings API returns building object directly
  const building = buildingQuery.data ?? null;

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      name: "",
      address: "",
      totalFloors: "",
      totalRooms: "",
    },
  });

  // Reset form when building data loads
  React.useEffect(() => {
    if (building) {
      form.reset({
        name: building.name,
        address: building.address,
        totalFloors: String(building.totalFloors),
        totalRooms: String(building.totalRooms),
      });
    }
  }, [building, form]);

  const updateBuildingMutation = useMutation({
    mutationFn: (updates: {
      name: string;
      address: string;
      totalFloors: number;
      totalRooms: number;
    }) => buildingsApi.update(buildingId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });

  if (buildingQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดข้อมูลอาคาร..." />;
  }

  const onSubmit = async (data: BuildingFormValues) => {
    try {
      await updateBuildingMutation.mutateAsync({
        name: data.name,
        address: data.address,
        totalFloors: Number.parseInt(data.totalFloors, 10),
        totalRooms: Number.parseInt(data.totalRooms, 10),
      });

      toast({
        title: "สำเร็จ",
        description: "อัปเดตอาคารเรียบร้อย",
      });

      router.push("/overview/buildings");
    } catch (error) {
      console.error("Failed to update building:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "อัปเดตอาคารไม่สำเร็จ",
        variant: "destructive",
      });
    }
  };

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
          <CardDescription>อัปเดตรายละเอียดอาคาร</CardDescription>
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
