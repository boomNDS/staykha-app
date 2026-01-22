"use client";

import { useQuery } from "@tanstack/react-query";
import { Edit, User, UserPlus, UserX } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingState } from "@/components/loading-state";
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { getData } from "@/lib/api/response-helpers";
import { useParams, useRouter } from "@/lib/router";
import type { Room, Tenant } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const roomId = params.id as string;
  usePageTitle(`ห้อง ${roomId}`);

  const roomQuery = useQuery({
    queryKey: ["rooms", roomId],
    queryFn: () => roomsApi.getById(roomId),
    enabled: Boolean(roomId),
  });

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll(),
    enabled: Boolean(roomId),
  });

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

  const room = roomQuery.data ?? null;
  // Tenants API returns array directly
  const tenants = tenantsQuery.data ?? [];

  const updateTenantMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Tenant> }) =>
      tenantsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

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

  const getRoomStatusLabel = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return "เข้าพัก";
      case "vacant":
        return "ว่าง";
      case "maintenance":
        return "ซ่อมบำรุง";
      default:
        return status;
    }
  };

  const getTenantByRoom = (room: Room) => {
    // Use tenant from room object if available (from API response)
    if (room.tenant) {
      return {
        id: room.tenant.id,
        name: room.tenant.name,
        email: room.tenant.email,
        roomId: room.id,
      } as Tenant;
    }
    // Fallback to looking up in tenants array
    return tenants.find((tenant) => tenant.roomId === room.id) || null;
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
          if (!tenant || !tenant.id) {
            throw new Error("ไม่พบข้อมูลผู้เช่า");
          }
          const { id: tenantId, ...tenantWithoutId } = tenant;
          await updateTenantMutation.mutateAsync({
            id: tenantId,
            updates: {
              ...tenantWithoutId,
              roomId: null,
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
          // Also update room status to vacant
          await updateRoomMutation.mutateAsync({
            roomNumber: room.roomNumber,
            buildingId: room.buildingId,
            floor: room.floor,
            status: "VACANT",
            monthlyRent: room.monthlyRent,
            size: room.size,
          });
          // Explicitly refetch to ensure data is fresh before navigation
          await queryClient.refetchQueries({ queryKey: ["rooms"] });
          await queryClient.refetchQueries({ queryKey: ["tenants"] });
          setConfirmState((prev) => ({ ...prev, open: false }));
          router.push("/overview/rooms");
        } catch (error) {
          console.error("Failed to unassign tenant:", error);
        }
      },
    });
  };

  if (roomQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดข้อมูลห้อง..." />;
  }

  if (!room) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">ไม่พบข้อมูลห้อง</p>
        <Button
          variant="outline"
          onClick={() => router.push("/overview/rooms")}
          className="mt-4"
        >
          กลับไปหน้ารายการห้อง
        </Button>
      </div>
    );
  }

  const tenant = getTenantByRoom(room);
  const isMutating =
    updateTenantMutation.isPending || updateRoomMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ห้อง ${room.roomNumber}`}
        description={`${room.buildingName || "—"} • ชั้น ${room.floor}`}
        showBack
        actions={
          <Button
            onClick={() => router.push(`/overview/rooms/${roomId}/edit`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            แก้ไขห้อง
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลห้อง</CardTitle>
            <CardDescription>รายละเอียดพื้นฐานของห้อง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  สถานะ
                </p>
                <p className="mt-2 text-sm font-semibold capitalize text-foreground">
                  {getRoomStatusLabel(room.status)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ค่าเช่ารายเดือน
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {room.monthlyRent
                    ? `฿${room.monthlyRent.toLocaleString()}`
                    : "ยังไม่ได้ตั้งค่า"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ขนาดห้อง
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {room.size ? `${room.size} ตร.ม.` : "ยังไม่ได้ตั้งค่า"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  รหัสห้อง
                </p>
                <p className="mt-2 text-xs font-mono text-foreground">
                  {room.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ผู้เช่า</CardTitle>
                <CardDescription>
                  {tenant ? "ข้อมูลผู้เช่าปัจจุบัน" : "ยังไม่มีผู้เช่า"}
                </CardDescription>
              </div>
              {room.status === "occupied" && tenant && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnassignTenant}
                  disabled={isMutating}
                  className="gap-2"
                >
                  <UserX className="h-4 w-4" />
                  ยกเลิกผู้เช่า
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {tenant ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">ชื่อ</p>
                  <p className="text-sm font-medium text-foreground">
                    {tenant.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">อีเมล</p>
                  <p className="text-sm text-foreground">{tenant.email}</p>
                </div>
                {tenant.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">เบอร์โทรศัพท์</p>
                    <p className="text-sm text-foreground">{tenant.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <User className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">ยังไม่มีผู้เช่า</p>
                {room.status !== "occupied" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/overview/rooms/${roomId}/edit`)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    ผูกผู้เช่า
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        isLoading={isMutating}
        onConfirm={async () => {
          const action = confirmState.onConfirm;
          if (!action) return;
          try {
            await action();
          } catch (error) {
            console.error("Failed to unassign tenant:", error);
          }
        }}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
