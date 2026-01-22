"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useForm } from "react-hook-form";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TenantInlineForm } from "@/components/rooms/tenant-inline-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, UserPlus, UserX } from "lucide-react";
import { buildingsApi, roomsApi, tenantsApi } from "@/lib/api-client";
import type { TenantCreateRequest } from "@/lib/api/services/tenants-types";
import { getData, getList } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "@/lib/router";
import { roomFormSchema, tenantDraftSchema } from "@/lib/schemas";
import type { Tenant, TenantDraft } from "@/lib/types";
import { TenantStatus } from "@/lib/types";
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
  const { user } = useAuth();
  const [assignTenantNow, setAssignTenantNow] = React.useState(false);
  const [createTenantMode, setCreateTenantMode] = React.useState(false);
  const [selectedTenantId, setSelectedTenantId] = React.useState("");
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
  const [confirmState, setConfirmState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    description: "",
  });
  const [pendingFormData, setPendingFormData] =
    React.useState<RoomFormValues | null>(null);

  const roomQuery = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => roomsApi.getById(roomId),
    enabled: Boolean(roomId),
  });
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll(),
  });
  const allRoomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  // Buildings API returns array directly
  const buildings = buildingsQuery.data ?? [];
  // Tenants API returns array directly
  const tenants = tenantsQuery.data ?? [];
  // Rooms API returns array directly (for checking current room assignments)
  const allRooms = allRoomsQuery.data ?? [];

  // Rooms API returns room object directly
  const room = roomQuery.data ?? null;

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

  // Reset form when room data loads (wait for both room and buildings)
  React.useEffect(() => {
    if (room && buildings.length > 0) {
      // Ensure buildingId exists in buildings array before setting
      const buildingId = String(room.buildingId);
      const buildingExists = buildings.some(
        (b) => String(b.id) === buildingId,
      );
      
      if (buildingExists) {
        // Ensure status is lowercase for form
        const statusLower = (
          room.status?.toLowerCase() ?? "vacant"
        ) as "occupied" | "vacant" | "maintenance";
        
        form.reset({
          roomNumber: room.roomNumber,
          buildingId: buildingId,
          floor: String(room.floor),
          status: statusLower,
          monthlyRent: room.monthlyRent ? String(room.monthlyRent) : "",
          size: room.size ? String(room.size) : "",
        }, {
          keepDefaultValues: false,
        });
        
        // Explicitly set values to ensure Select components update
        form.setValue("buildingId", buildingId, { shouldValidate: false });
        form.setValue("status", statusLower, { shouldValidate: false });
      }
    }
  }, [room, buildings, form]);

  const updateRoomMutation = useMutation({
    mutationFn: (updates: {
      roomNumber: string;
      buildingId: string;
      floor: number;
      status: "OCCUPIED" | "VACANT" | "MAINTENANCE";
      monthlyRent?: number;
      size?: number;
    }) => roomsApi.update(roomId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
  const createTenantMutation = useMutation({
    mutationFn: (payload: TenantCreateRequest) => tenantsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Tenant> }) =>
      tenantsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const getAvailableTenants = () => {
    // Show all tenants to allow reassignment from one room to another
    return tenants;
  };

  if (
    roomQuery.isLoading ||
    buildingsQuery.isLoading ||
    tenantsQuery.isLoading ||
    allRoomsQuery.isLoading
  ) {
    return <LoadingState fullScreen message="กำลังโหลดข้อมูลห้อง..." />;
  }

  const onSubmit = async (data: RoomFormValues) => {
    try {
      // Validate tenant data only if creating new tenant
      if (assignTenantNow && createTenantMode) {
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

      // Validate that a tenant is selected if assigning existing tenant
      if (assignTenantNow && !createTenantMode && !selectedTenantId) {
        setTenantErrors({
          form: "กรุณาเลือกผู้เช่าหรือสร้างผู้เช่าใหม่",
        });
        return;
      }

      // Check if status is changing to "vacant" and room was previously occupied
      const isChangingToVacant =
        data.status === "vacant" && room?.status === "occupied";

      if (isChangingToVacant) {
        // Store form data and show confirmation dialog
        setPendingFormData(data);
        setConfirmState({
          open: true,
          title: "ยืนยันการเปลี่ยนสถานะเป็นว่าง?",
          description:
            "การเปลี่ยนสถานะเป็นว่างจะทำให้ผู้เช่าถูกยกเลิกการผูกกับห้องนี้ คุณต้องการดำเนินการต่อหรือไม่?",
          onConfirm: async () => {
            await performRoomUpdate(data);
          },
        });
        return;
      }

      // Proceed with update if not changing to vacant
      await performRoomUpdate(data);
    } catch (error) {
      console.error("Failed to update room:", error);
    }
  };

  const handleUnassignTenant = () => {
    if (!room?.tenant || !room?.tenantId) return;
    setConfirmState({
      open: true,
      title: "ยกเลิกผู้เช่า?",
      description: "ผู้เช่าจะถูกยกเลิกการผูกกับห้องนี้ และสถานะห้องจะเปลี่ยนเป็นว่าง",
      onConfirm: async () => {
        try {
          // Fetch tenant to get full data for update
          // Tenants API returns tenant object directly
          const tenant = await tenantsApi.getById(room.tenantId!);
          if (!tenant) {
            throw new Error("ไม่พบข้อมูลผู้เช่า");
          }
          const { id: tenantId, ...tenantWithoutId } = tenant;
          await updateTenantMutation.mutateAsync({
            id: tenantId,
            updates: { ...tenantWithoutId, roomId: null },
          });
          // Also update room status to vacant
          await updateRoomMutation.mutateAsync({
            roomNumber: form.getValues("roomNumber"),
            buildingId: form.getValues("buildingId"),
            floor: Number.parseInt(form.getValues("floor"), 10),
            status: "VACANT",
            monthlyRent: form.getValues("monthlyRent")
              ? Number.parseFloat(form.getValues("monthlyRent"))
              : undefined,
            size: form.getValues("size")
              ? Number.parseFloat(form.getValues("size"))
              : undefined,
          });
          setConfirmState((prev) => ({ ...prev, open: false }));
          router.push("/overview/rooms");
        } catch (error) {
          console.error("Failed to unassign tenant:", error);
        }
      },
    });
  };

  const performRoomUpdate = async (data: RoomFormValues) => {
    try {
      await updateRoomMutation.mutateAsync({
        roomNumber: data.roomNumber,
        buildingId: data.buildingId,
        floor: Number.parseInt(data.floor, 10),
        status: data.status.toUpperCase() as "OCCUPIED" | "VACANT" | "MAINTENANCE",
        monthlyRent: data.monthlyRent
          ? Number.parseFloat(data.monthlyRent)
          : undefined,
        size: data.size ? Number.parseFloat(data.size) : undefined,
      });

      // Handle tenant assignment if enabled
      if (assignTenantNow && room?.status !== "occupied") {
        if (createTenantMode) {
          // Create new tenant
          if (!user?.teamId) {
            throw new Error("ไม่พบข้อมูลทีม");
          }
          await createTenantMutation.mutateAsync({
            name: tenantData.name,
            email: tenantData.email,
            phone: tenantData.phone,
            moveInDate: tenantData.moveInDate,
            deposit: tenantData.deposit || "0",
            roomId,
            monthlyRent: data.monthlyRent || "0",
            status: TenantStatus.ACTIVE,
            teamId: user.teamId,
          });
        } else if (selectedTenantId) {
          // Assign existing tenant
          const tenant = tenants.find((t) => t.id === selectedTenantId);
          if (!tenant) {
            throw new Error("ไม่พบข้อมูลผู้เช่า");
          }
          const { id: tenantId, ...tenantWithoutId } = tenant;
          await updateTenantMutation.mutateAsync({
            id: tenantId,
            updates: {
              ...tenantWithoutId,
              roomId,
              monthlyRent:
                typeof tenantWithoutId.monthlyRent === "string"
                  ? Number.parseFloat(tenantWithoutId.monthlyRent)
                  : tenantWithoutId.monthlyRent,
              deposit:
                typeof tenantWithoutId.deposit === "string"
                  ? Number.parseFloat(tenantWithoutId.deposit)
                  : tenantWithoutId.deposit,
            },
          });
        }
      }
      // Wait a bit to ensure queries are invalidated, then navigate
      await queryClient.refetchQueries({ queryKey: ["rooms"] });
      await queryClient.refetchQueries({ queryKey: ["tenants"] });
      router.push("/overview/rooms");
    } catch (error) {
      console.error("Failed to update room:", error);
      throw error;
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
                  render={({ field }) => {
                    const currentValue = field.value ? String(field.value) : "";
                    return (
                      <FormItem>
                        <FormLabel>อาคาร *</FormLabel>
                        <Select
                          key={`building-select-${currentValue}-${buildings.length}`}
                          onValueChange={field.onChange}
                          value={currentValue}
                          disabled={form.formState.isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกอาคาร" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem
                                key={building.id}
                                value={String(building.id)}
                              >
                                {building.name}
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
                  render={({ field }) => {
                    const currentValue = field.value
                      ? (field.value.toLowerCase() as
                          | "occupied"
                          | "vacant"
                          | "maintenance")
                      : "vacant";
                    return (
                      <FormItem>
                        <FormLabel>สถานะ</FormLabel>
                        <Select
                          key={`status-select-${currentValue}`}
                          onValueChange={field.onChange}
                          value={currentValue}
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
                    );
                  }}
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

              {/* Show current tenant if room is occupied */}
              {room?.status === "occupied" && room?.tenant && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <User className="h-4 w-4 text-muted-foreground" />
                      ผู้เช่าปัจจุบัน
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnassignTenant}
                      disabled={
                        form.formState.isSubmitting ||
                        updateTenantMutation.isPending
                      }
                      className="gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      ยกเลิกผู้เช่า
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">ชื่อ</p>
                      <p className="text-sm font-medium text-foreground">
                        {room.tenant.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">อีเมล</p>
                      <p className="text-sm text-foreground">
                        {room.tenant.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show tenant assignment form if room is not occupied */}
              {room?.status !== "occupied" && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        ผูกผู้เช่าตอนนี้
                      </p>
                      <p className="text-xs text-muted-foreground">
                        เลือกผู้เช่าที่มีอยู่หรือสร้างผู้เช่าใหม่
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={assignTenantNow ? "default" : "outline"}
                      onClick={() => {
                        setAssignTenantNow((prev) => !prev);
                        if (!assignTenantNow) {
                          setCreateTenantMode(false);
                          setSelectedTenantId("");
                        }
                      }}
                    >
                      {assignTenantNow ? "ปิด" : "เพิ่มผู้เช่า"}
                    </Button>
                  </div>
                  {assignTenantNow && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>เลือกผู้เช่า</Label>
                        <Button
                          type="button"
                          variant={createTenantMode ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCreateTenantMode((prev) => !prev);
                            if (!createTenantMode) {
                              setSelectedTenantId("");
                            }
                          }}
                          disabled={form.formState.isSubmitting}
                        >
                          {createTenantMode ? "กำลังเลือก" : "สร้างผู้เช่า"}
                        </Button>
                      </div>
                      {!createTenantMode ? (
                        <div className="space-y-4">
                          <Select
                            value={selectedTenantId}
                            onValueChange={setSelectedTenantId}
                            disabled={form.formState.isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกผู้เช่า" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableTenants().map((tenant) => {
                                const currentRoom = tenant.roomId
                                  ? allRooms.find((r) => r.id === tenant.roomId)
                                  : null;
                                return (
                                  <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.name} - {tenant.email}
                                    {currentRoom && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (ห้อง {currentRoom.roomNumber})
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {/* Show selected tenant information */}
                          {selectedTenantId && (
                            <div className="rounded-lg border border-border bg-muted/20 p-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                                <User className="h-4 w-4 text-muted-foreground" />
                                ข้อมูลผู้เช่าที่เลือก
                              </div>
                              {(() => {
                                const selectedTenant = tenants.find(
                                  (t) => t.id === selectedTenantId,
                                );
                                if (!selectedTenant) return null;
                                return (
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        ชื่อ
                                      </p>
                                      <p className="text-sm font-medium text-foreground">
                                        {selectedTenant.name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">
                                        อีเมล
                                      </p>
                                      <p className="text-sm text-foreground">
                                        {selectedTenant.email}
                                      </p>
                                    </div>
                                    {selectedTenant.phone && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          เบอร์โทรศัพท์
                                        </p>
                                        <p className="text-sm text-foreground">
                                          {selectedTenant.phone}
                                        </p>
                                      </div>
                                    )}
                                    {selectedTenant.roomId && (
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          ห้องปัจจุบัน
                                        </p>
                                        <p className="text-sm text-foreground">
                                          {
                                            allRooms.find(
                                              (r) => r.id === selectedTenant.roomId,
                                            )?.roomNumber || selectedTenant.roomId
                                          }
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
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

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        isLoading={
          updateRoomMutation.isPending || updateTenantMutation.isPending
        }
        onConfirm={async () => {
          const action = confirmState.onConfirm;
          if (!action) return;
          try {
            await action();
            setConfirmState((prev) => ({ ...prev, open: false }));
            setPendingFormData(null);
          } catch (error) {
            console.error("Failed to update room:", error);
          }
        }}
        onOpenChange={(open) =>
          setConfirmState((prev) => ({ ...prev, open }))
        }
      />
    </div>
  );
}
