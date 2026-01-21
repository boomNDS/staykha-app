"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    (room: Room) =>
      room.status === "vacant" || room.id === getData(tenantQuery.data)?.roomId,
  );

  const tenant = getData(tenantQuery.data);

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
      status: "active",
    },
  });

  // Reset form when tenant data loads
  React.useEffect(() => {
    if (tenant) {
      form.reset({
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
  }, [tenant, form]);

  const updateTenantMutation = useMutation({
    mutationFn: (updates: TenantFormValues) =>
      tenantsApi.update(tenantId, {
        ...updates,
        monthlyRent: Number.parseFloat(updates.monthlyRent || "0"),
        deposit: Number.parseFloat(updates.deposit || "0"),
      }),
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
      await updateTenantMutation.mutateAsync(data);
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ผูกห้อง *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={form.formState.isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกห้อง" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.roomNumber} - {room.buildingName}
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
                          <SelectItem value="active">ใช้งาน</SelectItem>
                          <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                          <SelectItem value="expired">หมดอายุ</SelectItem>
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
    </div>
  );
}
