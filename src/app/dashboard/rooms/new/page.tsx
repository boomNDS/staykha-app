"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { EmptyState } from "@/components/empty-state";
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
import { useToast } from "@/hooks/use-toast";
import { buildingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { getData, getList } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import { roomFormSchema } from "@/lib/schemas";
import type { z } from "zod";
import { usePageTitle } from "@/lib/use-page-title";

type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function NewRoomPage() {
  usePageTitle("เพิ่มห้องใหม่");

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("จำเป็นต้องมี Team ID เพื่อโหลด Settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });
  // Buildings API returns array directly
  const buildings = buildingsQuery.data ?? [];
  const settings = getData(settingsQuery.data);

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

  // Set default values from settings
  React.useEffect(() => {
    if (settings) {
      if (!form.getValues("monthlyRent") && settings.defaultRoomRent) {
        form.setValue("monthlyRent", String(settings.defaultRoomRent));
      }
      if (!form.getValues("size") && settings.defaultRoomSize) {
        form.setValue("size", String(settings.defaultRoomSize));
      }
    }
  }, [settings, form]);

  if (buildingsQuery.isSuccess && buildings.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
        title="ต้องสร้างอาคารก่อนเพิ่มห้อง"
        description="ยังไม่มีอาคารในระบบ กรุณาสร้างอาคารก่อนเพื่อเพิ่มห้อง"
        actionLabel="สร้างอาคาร"
        actionHref="/overview/buildings/new"
        variant="page"
      />
    );
  }

  const createRoomMutation = useMutation({
    mutationFn: (payload: {
      roomNumber: string;
      buildingId: string;
      floor: number;
      status: "occupied" | "vacant" | "maintenance";
      monthlyRent?: number;
      size?: number;
    }) =>
      roomsApi.create({
        ...payload,
        status: payload.status.toUpperCase() as "OCCUPIED" | "VACANT" | "MAINTENANCE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const onSubmit = async (data: RoomFormValues) => {
    try {
      await createRoomMutation.mutateAsync({
        roomNumber: data.roomNumber,
        buildingId: data.buildingId,
        floor: Number.parseInt(data.floor, 10),
        status: data.status,
        monthlyRent: data.monthlyRent
          ? Number.parseFloat(data.monthlyRent)
          : undefined,
        size: data.size ? Number.parseFloat(data.size) : undefined,
      });
      router.push("/overview/rooms");
    } catch (error) {
      logError(error, {
        scope: "rooms",
        action: "create",
        metadata: {
          buildingId: data.buildingId,
          roomNumber: data.roomNumber,
        },
      });
      toast({
        title: "เพิ่มห้องไม่สำเร็จ",
        description: getErrorMessage(error, "ไม่สามารถเพิ่มห้องได้"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="เพิ่มห้องใหม่"
        description="สร้างห้องใหม่ในระบบ"
        showBack
      />

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลห้อง</CardTitle>
          <CardDescription>กรอกรายละเอียดห้องใหม่</CardDescription>
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
                          placeholder="101"
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

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "กำลังสร้าง..."
                    : "สร้างห้อง"}
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
