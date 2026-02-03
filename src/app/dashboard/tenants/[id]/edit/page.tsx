"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useForm } from "react-hook-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { getData, getList } from "@/lib/api/response-helpers";
import { useParams, useRouter } from "@/lib/router";
import { tenantFormSchema } from "@/lib/schemas";
import type { Room } from "@/lib/types";
import { TenantStatus } from "@/lib/types";
import type { z } from "zod";
import { usePageTitle } from "@/lib/use-page-title";

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export default function EditTenantPage() {
  const params = useParams();
  const tenantId = params.id as string;
  usePageTitle(`แก้ไขผู้เช่า ${tenantId}`);

  const router = useRouter();
  const queryClient = useQueryClient();

  const tenantQuery = useQuery({
    queryKey: ["tenants", tenantId],
    queryFn: () => tenantsApi.getById(tenantId),
    enabled: Boolean(tenantId),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const rooms = getList(roomsQuery.data).filter(
    (room: Room) => {
      const tenantData = getData(tenantQuery.data);
      const tenantRoomId = tenantData?.room?.id || tenantData?.roomId;
      return room.status === "vacant" || room.id === tenantRoomId;
    },
  );

  const tenant = getData(tenantQuery.data);

  // Debug logging
  if (import.meta.env.DEV) {
    console.log("[Tenant Edit] Debug Info:", {
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        roomId: tenant.roomId,
        room: tenant.room ? {
          id: tenant.room.id,
          roomNumber: tenant.room.roomNumber,
          building: tenant.room.building,
        } : null,
      } : null,
      roomsCount: rooms.length,
      rooms: rooms.map((r) => ({ id: r.id, roomNumber: r.roomNumber, buildingName: r.buildingName })),
      roomsQueryLoading: roomsQuery.isLoading,
      tenantQueryLoading: tenantQuery.isLoading,
    });
  }

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
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
      status: TenantStatus.ACTIVE,
    },
  });

  // Reset form when tenant and rooms data loads
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Tenant Edit] useEffect triggered:", {
        hasTenant: !!tenant,
        hasRoomsData: !!roomsQuery.data,
        tenantRoomId: tenant?.roomId,
        tenantRoom: tenant?.room,
      });
    }

    if (tenant && roomsQuery.data) {
      // Convert ISO date to YYYY-MM-DD format for date input
      const formatDateForInput = (dateString: string | null | undefined): string => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      // Get roomId from tenant.room.id if available, otherwise use tenant.roomId
      const roomId = tenant.room?.id || tenant.roomId || "";

      if (import.meta.env.DEV) {
        console.log("[Tenant Edit] Extracted roomId:", {
          fromRoomObject: tenant.room?.id,
          fromRoomId: tenant.roomId,
          finalRoomId: roomId,
          roomsAvailable: rooms.map((r) => r.id),
          roomIdInRoomsList: rooms.some((r) => r.id === roomId),
        });
      }

      form.reset({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        roomId: roomId, // Set roomId directly in reset instead of empty string
        moveInDate: formatDateForInput(tenant.moveInDate),
        contractEndDate: formatDateForInput(tenant.contractEndDate),
        monthlyRent: tenant.monthlyRent?.toString() ?? "",
        deposit: tenant.deposit?.toString() ?? "",
        idCardNumber: tenant.idCardNumber ?? "",
        emergencyContact: tenant.emergencyContact ?? "",
        emergencyPhone: tenant.emergencyPhone ?? "",
        status: tenant.status,
      }, {
        keepDefaultValues: false,
      });

      if (import.meta.env.DEV) {
        console.log("[Tenant Edit] Form reset completed, current roomId value:", form.getValues("roomId"));
      }

      // Explicitly set roomId after reset to ensure Select component updates
      // Use setTimeout to ensure it happens after the reset is complete
      if (roomId) {
        setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log("[Tenant Edit] Setting roomId via setValue (delayed):", roomId);
          }
          form.setValue("roomId", roomId, { shouldValidate: false, shouldDirty: false, shouldTouch: false });
          
          if (import.meta.env.DEV) {
            console.log("[Tenant Edit] After setValue (delayed), roomId value:", form.getValues("roomId"));
          }
        }, 0);
      } else {
        if (import.meta.env.DEV) {
          console.log("[Tenant Edit] No roomId to set, roomId is empty");
        }
      }
    }
  }, [tenant, roomsQuery.data, form]);

  const updateTenantMutation = useMutation({
    mutationFn: (updates: any) => tenantsApi.update(tenantId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  if (tenantQuery.isLoading || roomsQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดผู้เช่า..." />;
  }

  const onSubmit = async (data: TenantFormValues) => {
    try {
      // Zod schema already transforms empty strings to null, but ensure numbers are converted
      const payload = {
        ...data,
        monthlyRent: Number.parseFloat(data.monthlyRent || "0"),
        deposit: Number.parseFloat(data.deposit || "0"),
      };
      
      if (import.meta.env.DEV) {
        console.log("[Tenant Edit] Submitting payload:", payload);
      }
      
      await updateTenantMutation.mutateAsync(payload);
      router.push("/overview/tenants");
    } catch (error) {
      console.error("Failed to update tenant:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="แก้ไขผู้เช่า"
        description="อัปเดตข้อมูลผู้เช่า"
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลผู้เช่า</CardTitle>
          <CardDescription>อัปเดตรายละเอียดผู้เช่า</CardDescription>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ-นามสกุล *</FormLabel>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อีเมล *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์ *</FormLabel>
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
                  name="roomId"
                  render={({ field }) => {
                    if (import.meta.env.DEV) {
                      console.log("[Tenant Edit] Select render:", {
                        fieldValue: field.value,
                        roomsCount: rooms.length,
                        roomsIds: rooms.map((r) => r.id),
                        fieldValueInRooms: rooms.some((r) => r.id === field.value),
                      });
                    }
                    return (
                      <FormItem>
                        <FormLabel>ผูกห้อง *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            if (import.meta.env.DEV) {
                              console.log("[Tenant Edit] Select onValueChange:", value, "Previous value:", field.value);
                            }
                            // Only update if value is not empty or if it's a valid room ID
                            if (value || !field.value) {
                              field.onChange(value);
                            } else if (import.meta.env.DEV) {
                              console.log("[Tenant Edit] Ignoring empty value change, keeping:", field.value);
                            }
                          }}
                          value={field.value || ""}
                          disabled={form.formState.isSubmitting}
                          key={`room-select-${tenant?.room?.id || tenant?.roomId || "none"}-${field.value || "empty"}`}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกห้อง" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.roomNumber} - {room.buildingName || room.building?.name || ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="moveInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันที่ย้ายเข้า *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
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
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันสิ้นสุดสัญญา</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
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
                      <FormLabel>ค่าเช่ารายเดือน (บาท)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เงินประกัน (บาท)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  name="idCardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เลขบัตรประชาชน</FormLabel>
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
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อผู้ติดต่อฉุกเฉิน</FormLabel>
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
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์ผู้ติดต่อฉุกเฉิน</FormLabel>
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
                          <SelectItem value={TenantStatus.ACTIVE}>ใช้งาน</SelectItem>
                          <SelectItem value={TenantStatus.INACTIVE}>ไม่ใช้งาน</SelectItem>
                          <SelectItem value={TenantStatus.EXPIRED}>หมดอายุ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>เชื่อมต่อ LINE</CardTitle>
            <CardDescription>
              สร้างโค้ดเพื่อให้ผู้เช่าเชื่อมบัญชี LINE กับระบบ
            </CardDescription>
          </div>
          <Badge variant="outline">Coming soon</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ฟีเจอร์นี้กำลังพัฒนา จะช่วยส่งโค้ดเชื่อมต่อ LINE ให้ผู้เช่า
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled>
              สร้างโค้ด LINE
            </Button>
            <Button type="button" variant="outline" disabled>
              ส่งข้อความทดสอบ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
