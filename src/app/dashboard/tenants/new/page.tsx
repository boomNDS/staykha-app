"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as React from "react";
import { useForm } from "react-hook-form";
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
import { getList } from "@/lib/api/response-helpers";
import { useRouter } from "@/lib/router";
import { tenantFormSchema } from "@/lib/schemas";
import type { Room } from "@/lib/types";
import type { z } from "zod";
import { usePageTitle } from "@/lib/use-page-title";

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export default function NewTenantPage() {
  usePageTitle("เพิ่มผู้เช่าใหม่");

  const router = useRouter();
  const queryClient = useQueryClient();
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const rooms = getList(roomsQuery.data).filter(
    (room: Room) => room.status === "vacant",
  );

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      roomId: "",
      moveInDate: new Date().toISOString().split("T")[0],
      contractEndDate: "",
      monthlyRent: "",
      deposit: "",
      idCardNumber: "",
      emergencyContact: "",
      emergencyPhone: "",
      status: "active",
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: (payload: TenantFormValues) =>
      tenantsApi.create({
        ...payload,
        monthlyRent: Number.parseFloat(payload.monthlyRent || "0"),
        deposit: Number.parseFloat(payload.deposit || "0"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const onSubmit = async (data: TenantFormValues) => {
    try {
      await createTenantMutation.mutateAsync(data);
      router.push("/overview/tenants");
    } catch (error) {
      console.error("Failed to create tenant:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="เพิ่มผู้เช่าใหม่"
        description="กรอกข้อมูลผู้เช่าและผูกห้อง"
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลผู้เช่า</CardTitle>
          <CardDescription>กรอกรายละเอียดผู้เช่าใหม่</CardDescription>
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
                          placeholder="กรอกชื่อ-นามสกุล"
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
                          placeholder="email@example.com"
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
                          placeholder="081-234-5678"
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
                      <Button asChild variant="link" className="px-0 text-sm">
                        <Link to="/overview/rooms/new">สร้างห้องใหม่แทน</Link>
                      </Button>
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
                          placeholder="0.00"
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
                          placeholder="0.00"
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
                          placeholder="1-2345-67890-12-3"
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
                          placeholder="ชื่อผู้ติดต่อ"
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
                          placeholder="081-234-5678"
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
                    ? "กำลังสร้าง..."
                    : "สร้างผู้เช่า"}
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
