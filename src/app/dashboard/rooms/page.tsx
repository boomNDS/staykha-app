"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Plus, Trash2, User, UserPlus, UserX } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TenantInlineForm } from "@/components/rooms/tenant-inline-form";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { useRouter } from "@/lib/router";
import { mapZodErrors, tenantDraftSchema } from "@/lib/schemas";
import type { Room, Tenant, TenantDraft } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function RoomsPage() {
  usePageTitle("ห้องพัก");

  const router = useRouter();
  const queryClient = useQueryClient();
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll(),
  });
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const [selectedTenantId, setSelectedTenantId] = React.useState("");
  const [createTenantMode, setCreateTenantMode] = React.useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);
  const [detailsRoom, setDetailsRoom] = React.useState<Room | null>(null);
  const [newTenant, setNewTenant] = React.useState<TenantDraft>({
    name: "",
    email: "",
    phone: "",
    moveInDate: new Date().toISOString().split("T")[0],
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

  const rooms = roomsQuery.data?.rooms ?? [];
  const tenants = tenantsQuery.data?.tenants ?? [];
  const loading = roomsQuery.isLoading || tenantsQuery.isLoading;

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Tenant> }) =>
      tenantsApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
  const createTenantMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      email: string;
      phone: string;
      moveInDate: string;
      roomId: string;
      monthlyRent: number;
      deposit: number;
      status: "active";
    }) => tenantsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
  const isDeleting = deleteRoomMutation.isPending;
  const isAssigning = updateTenantMutation.isPending;
  const isCreatingTenant = createTenantMutation.isPending;
  const isMutating = isDeleting || isAssigning || isCreatingTenant;

  const getTenantName = (roomId: string) => {
    const tenant = tenants.find((t) => t.roomId === roomId);
    return tenant?.name || "ไม่ระบุ";
  };

  const getTenantByRoom = (roomId: string) =>
    tenants.find((tenant) => tenant.roomId === roomId) || null;

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

  const getAvailableTenants = () => {
    return tenants.filter((t) => !t.roomId || t.roomId === selectedRoom?.id);
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "ยืนยันการลบห้อง?",
      description: "การลบห้องนี้จะไม่สามารถกู้คืนได้",
      confirmLabel: "ลบ",
      cancelLabel: "ยกเลิก",
      onConfirm: async () => {
        try {
          await deleteRoomMutation.mutateAsync(id);
        } catch (error) {
          console.error("Failed to delete room:", error);
        }
      },
    });
  };

  const handleAssignTenant = (room: Room) => {
    setDetailsDialogOpen(false);
    setSelectedRoom(room);
    const currentTenant = tenants.find((t) => t.roomId === room.id);
    setSelectedTenantId(currentTenant?.id || "");
    setCreateTenantMode(false);
    setNewTenant({
      name: "",
      email: "",
      phone: "",
      moveInDate: new Date().toISOString().split("T")[0],
    });
    setAssignDialogOpen(true);
  };

  const handleViewDetails = (room: Room) => {
    setDetailsRoom(room);
    setDetailsDialogOpen(true);
  };

  const handleUnassignTenant = (room: Room) => {
    const tenant = tenants.find((t) => t.roomId === room.id);
    if (!tenant) return;
    setConfirmState({
      open: true,
      title: "ยกเลิกผู้เช่า?",
      description: "ผู้เช่าจะถูกยกเลิกการผูกกับห้องนี้",
      confirmLabel: "ยกเลิกการผูก",
      cancelLabel: "ยกเลิก",
      onConfirm: async () => {
        try {
          await updateTenantMutation.mutateAsync({
            id: tenant.id,
            updates: { ...tenant, roomId: "" },
          });
        } catch (error) {
          console.error("Failed to unassign tenant:", error);
        }
      },
    });
  };

  const handleSubmitAssignment = async () => {
    if (!selectedTenantId || !selectedRoom) return;

    const tenant = tenants.find((t) => t.id === selectedTenantId);
    if (!tenant) return;

    try {
      await updateTenantMutation.mutateAsync({
        id: tenant.id,
        updates: { ...tenant, roomId: selectedRoom.id },
      });
      setAssignDialogOpen(false);
    } catch (error) {
      console.error("Failed to assign tenant:", error);
    }
  };

  const handleCreateTenant = async () => {
    if (!selectedRoom) return;
    const tenantResult = tenantDraftSchema.safeParse(newTenant);
    if (!tenantResult.success) {
      setTenantErrors(mapZodErrors(tenantResult.error));
      return;
    }
    setTenantErrors({});
    try {
      await createTenantMutation.mutateAsync({
        ...newTenant,
        roomId: selectedRoom.id,
        monthlyRent: selectedRoom.monthlyRent || 0,
        deposit: 0,
        status: "active",
      });
      setAssignDialogOpen(false);
    } catch (error) {
      console.error("Failed to create tenant:", error);
    }
  };

  const columns = [
    {
      key: "roomNumber",
      header: "เลขห้อง",
      render: (room: Room) => (
        <div className="font-medium text-foreground">{room.roomNumber}</div>
      ),
      searchable: true,
    },
    {
      key: "buildingName",
      header: "อาคาร",
      render: (room: Room) => (
        <div className="text-sm text-muted-foreground">{room.buildingName}</div>
      ),
      searchable: true,
    },
    {
      key: "floor",
      header: "ชั้น",
      render: (room: Room) => (
        <div className="text-sm text-muted-foreground">ชั้น {room.floor}</div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (room: Room) => (
        <div className="space-y-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              room.status === "occupied"
                ? "bg-blue-500/10 text-blue-500"
                : room.status === "vacant"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
            }`}
          >
            {room.status === "occupied" && <User className="h-3 w-3" />}
            {getRoomStatusLabel(room.status)}
          </span>
          {room.status === "occupied" && (
            <div className="text-xs text-muted-foreground">
              {getTenantName(room.id)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (room: Room) => (
        <TableRowActions
          primary={{
            label: "ดูรายละเอียด",
            icon: Eye,
            onClick: () => handleViewDetails(room),
          }}
          items={[
            room.status === "occupied"
              ? {
                  label: "ยกเลิกผู้เช่า",
                  icon: UserX,
                  disabled: isMutating,
                  onClick: () => handleUnassignTenant(room),
                }
              : {
                  label: "ผูกผู้เช่า",
                  icon: UserPlus,
                  disabled: isMutating,
                  onClick: () => handleAssignTenant(room),
                },
            {
              label: "แก้ไขห้อง",
              icon: Edit,
              onClick: () => router.push(`/overview/rooms/${room.id}/edit`),
            },
            {
              label: "ลบห้อง",
              icon: Trash2,
              destructive: true,
              disabled: room.status === "occupied" || isDeleting,
              onClick: () => handleDelete(room.id),
            },
          ]}
        />
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "สถานะ",
      options: [
        { label: "เข้าพัก", value: "occupied" },
        { label: "ว่าง", value: "vacant" },
        { label: "ซ่อมบำรุง", value: "maintenance" },
      ],
      filterFn: (room: Room, value: string) => room.status === value,
    },
    {
      key: "buildingName",
      label: "อาคาร",
      options: [
        { label: "อาคาร A", value: "อาคาร A" },
        { label: "อาคาร B", value: "อาคาร B" },
        { label: "อาคาร C", value: "อาคาร C" },
      ],
      filterFn: (room: Room, value: string) => room.buildingName === value,
    },
  ];

  if (loading) {
    return <LoadingState fullScreen message="กำลังโหลดห้อง..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="ห้องพัก"
          description="จัดการจำนวนห้องและสถานะห้องพัก"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/overview/rooms/bulk")}
              >
                เพิ่มหลายห้อง
              </Button>
              <Button
                onClick={() => router.push("/overview/rooms/new")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                เพิ่มห้อง
              </Button>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              จำนวนห้องทั้งหมด
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {rooms.length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              เข้าพัก
            </p>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {rooms.filter((room) => room.status === "occupied").length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              ว่าง
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">
              {rooms.filter((room) => room.status === "vacant").length}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              ซ่อมบำรุง
            </p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">
              {rooms.filter((room) => room.status === "maintenance").length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
          <DataTable
            data={rooms}
            columns={columns}
            searchPlaceholder="ค้นหาห้อง..."
            filters={filters}
            pageSize={4}
            forcePagination
          />
        </div>
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ผูกผู้เช่ากับห้อง</DialogTitle>
            <DialogDescription>
              {`เลือกผู้เช่าเพื่อผูกกับห้อง ${selectedRoom?.roomNumber || ""}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>เลือกผู้เช่า</Label>
              <Button
                type="button"
                variant={createTenantMode ? "default" : "outline"}
                size="sm"
                onClick={() => setCreateTenantMode((prev) => !prev)}
                disabled={isMutating}
              >
                {createTenantMode ? "กำลังเลือก" : "สร้างผู้เช่า"}
              </Button>
            </div>
            {!createTenantMode ? (
              <Select
                value={selectedTenantId}
                onValueChange={setSelectedTenantId}
                disabled={isMutating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้เช่า" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTenants().map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <TenantInlineForm
                value={newTenant}
                onChange={setNewTenant}
                errors={tenantErrors}
                disabled={isMutating}
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              disabled={isMutating}
            >
              ยกเลิก
            </Button>
            {createTenantMode ? (
              <Button
                onClick={handleCreateTenant}
                disabled={
                  !newTenant.name || !newTenant.email || isCreatingTenant
                }
              >
                {isCreatingTenant ? "กำลังสร้าง..." : "สร้างและผูก"}
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAssignment}
                disabled={!selectedTenantId || isAssigning}
              >
                {isAssigning ? "กำลังบันทึก..." : "ผูกผู้เช่า"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{`ห้อง ${detailsRoom?.roomNumber}`}</DialogTitle>
            <DialogDescription>
              {`${detailsRoom?.buildingName} • ชั้น ${detailsRoom?.floor}`}
            </DialogDescription>
          </DialogHeader>
          {detailsRoom && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    สถานะ
                  </p>
                  <p className="mt-2 text-sm font-semibold capitalize text-foreground">
                    {getRoomStatusLabel(detailsRoom.status)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    ค่าเช่ารายเดือน
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {detailsRoom.monthlyRent
                      ? `฿${detailsRoom.monthlyRent.toLocaleString()}`
                      : "ยังไม่ได้ตั้งค่า"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    ขนาดห้อง
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {detailsRoom.size
                      ? `${detailsRoom.size} ตร.ม.`
                      : "ยังไม่ได้ตั้งค่า"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    รหัสห้อง
                  </p>
                  <p className="mt-2 text-xs font-mono text-foreground">
                    {detailsRoom.id}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  ผู้เช่า
                </div>
                <div className="mt-3 space-y-1">
                  {getTenantByRoom(detailsRoom.id) ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        {getTenantByRoom(detailsRoom.id)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTenantByRoom(detailsRoom.id)?.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีผู้เช่า</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
              disabled={isMutating}
            >
              ปิด
            </Button>
            {detailsRoom?.status === "occupied" ? (
              <Button
                variant="outline"
                onClick={() => detailsRoom && handleUnassignTenant(detailsRoom)}
                disabled={isMutating}
              >
                ยกเลิกผู้เช่า
              </Button>
            ) : (
              <Button
                onClick={() => detailsRoom && handleAssignTenant(detailsRoom)}
                disabled={isMutating}
              >
                ผูกผู้เช่า
              </Button>
            )}
            <Button
              onClick={() =>
                detailsRoom &&
                router.push(`/overview/rooms/${detailsRoom.id}/edit`)
              }
              disabled={isMutating}
            >
              แก้ไขห้อง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="ยืนยัน"
        isLoading={isDeleting}
        onConfirm={async () => {
          const action = confirmState.onConfirm;
          if (!action) return;
          try {
            await action();
          } finally {
            setConfirmState((prev) => ({ ...prev, open: false }));
          }
        }}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
      />
    </>
  );
}
