"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildingsApi, roomsApi, tenantsApi } from "@/lib/api-client";
import { getData, getList } from "@/lib/api/response-helpers";
import { useParams, useRouter } from "@/lib/router";
import { roomFormSchema, tenantDraftSchema } from "@/lib/schemas";
import type { TenantDraft } from "@/lib/types";
import type { z } from "zod";
import { usePageTitle } from "@/lib/use-page-title";

type RoomFormValues = z.infer<typeof roomFormSchema>;
type TenantDraftFormValues = z.infer<typeof tenantDraftSchema>;

export default function EditRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  usePageTitle(`แก้ไขห้อง ${roomId}`);

  const router = useRouter();
  const queryClient = useQueryClient();
  const [assignTenantNow, setAssignTenantNow] = React.useState(false);
  const [tenantData, setTenantData] = React.useState<TenantDraft>({
    name: "",
    email: "",
    phone: "",
    moveInDate: new Date().toISOString().split("T")[0],
    deposit: "",
  });
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
  const buildings = getList(buildingsQuery.data);

  const room = getData(roomQuery.data);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      roomNumber: "",
      buildingId: "",
      floor: "1",
      status: "vacant",
      monthlyRent: "",
      size: "",
    },
  });

  // Reset form when room data loads
  React.useEffect(() => {
    if (room) {
      form.reset({
        roomNumber: room.roomNumber,
        buildingId: room.buildingId,
        floor: String(room.floor),
        status: room.status,
        monthlyRent: room.monthlyRent ? String(room.monthlyRent) : "",
        size: room.size ? String(room.size) : "",
      });
    }
  }, [room, form]);

  const updateRoomMutation = useMutation({
    mutationFn: (updates: {
      roomNumber: string;
      buildingId: string;
      floor: number;
      status: string;
      monthlyRent?: number;
      size?: number;
    }) => roomsApi.update(roomId, updates),
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

  const onSubmit = async (data: RoomFormValues) => {
    try {
      if (assignTenantNow) {
        const tenantResult = tenantDraftSchema.safeParse(tenantData);
        if (!tenantResult.success) {
          setTenantErrors(
            tenantResult.error.issues.reduce(
              (acc, issue) => {
                const key = String(issue.path[0] ?? "form");
                if (!acc[key]) {
                  acc[key] = issue.message;
                }
                return acc;
              },
              {} as Record<string, string>,
            ),
          );
          return;
        }
        setTenantErrors({});
      }

      await updateRoomMutation.mutateAsync({
        roomNumber: data.roomNumber,
        buildingId: data.buildingId,
        floor: Number.parseInt(data.floor, 10),
        status: data.status,
        monthlyRent: data.monthlyRent
          ? Number.parseFloat(data.monthlyRent)
          : undefined,
        size: data.size ? Number.parseFloat(data.size) : undefined,
      });

      if (assignTenantNow && room?.status !== "occupied") {
        await createTenantMutation.mutateAsync({
          name: tenantData.name,
          email: tenantData.email,
          phone: tenantData.phone,
          moveInDate: tenantData.moveInDate,
          deposit: tenantData.deposit
            ? Number.parseFloat(tenantData.deposit)
            : 0,
          roomId,
          monthlyRent: data.monthlyRent
            ? Number.parseFloat(data.monthlyRent)
            : 0,
          status: "active",
        });
      }
      router.push("/overview/rooms");
    } catch (error) {
      console.error("Failed to update room:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="แก้ไขห้อง"
        description="อัปเดตข้อมูลห้อง"
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลห้อง</CardTitle>
          <CardDescription>อัปเดตรายละเอียดห้อง</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="roomNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เลขห้อง *</FormLabel>
                      <FormControl>
                        <Input
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
                  name="buildingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อาคาร *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={form.formState.isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกอาคาร" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชั้น *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานะ</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={form.formState.isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vacant">ว่าง</SelectItem>
                          <SelectItem value="occupied">เข้าพัก</SelectItem>
                          <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ขนาดห้อง (ตร.ม.)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
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
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ค่าเช่ารายเดือน</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {room?.status !== "occupied" && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        ผูกผู้เช่าตอนนี้
                      </p>
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
                      disabled={form.formState.isSubmitting}
                    />
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "กำลังบันทึก..."
                    : "บันทึกการแก้ไข"}
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
