"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Plus, Trash2, User, UserPlus, UserX } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { TenantInlineForm } from "@/components/rooms/tenant-inline-form";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
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
import { Skeleton } from "@/components/ui/skeleton";
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { getList, getPaginationMeta } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import { mapZodErrors, tenantDraftSchema } from "@/lib/schemas";
import type { Room, Tenant, TenantDraft } from "@/lib/types";
import { TenantStatus } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function RoomsPage() {
  usePageTitle("ห้องพัก");

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [page, setPage] = React.useState(1);
  const limit = 4;
  const roomsQuery = useQuery({
    queryKey: ["rooms", page, limit],
    queryFn: () => roomsApi.getAll(undefined, { page, limit }),
  });
  const tenantsQuery = useQuery({
    queryKey: ["tenants", "all"],
    queryFn: () => tenantsApi.getAll(undefined, { page: 1, limit: 1000 }),
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

  const rooms = getList(roomsQuery.data);
  const roomsMeta = getPaginationMeta(roomsQuery.data);
  const tenants = getList(tenantsQuery.data);
  const loading = roomsQuery.isLoading || tenantsQuery.isLoading;
  const totalRooms = roomsMeta.total || rooms.length;

  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      updates: {
        roomNumber: string;
        buildingId: string;
        floor: number;
        status: "OCCUPIED" | "VACANT" | "MAINTENANCE";
        monthlyRent?: number;
        size?: number;
        tenantId?: string | null;
      };
    }) => roomsApi.update(payload.id, payload.updates),
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
      monthlyRent: number | string;
      deposit: number | string;
      status: TenantStatus.ACTIVE;
      teamId: string;
    }) => tenantsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
  const isDeleting = deleteRoomMutation.isPending;
  const isAssigning = updateRoomMutation.isPending || updateTenantMutation.isPending;
  const isCreatingTenant = createTenantMutation.isPending;
  const isMutating = isDeleting || isAssigning || isCreatingTenant;

  const getTenantName = (room: Room) => {
    // Use tenant from room object if available (from API response)
    if (room.tenant) {
      return room.tenant.name;
    }
    // Fallback to looking up in tenants array
    const tenant = tenants.find((t) => t.roomId === room.id);
    return tenant?.name || "ไม่ระบุ";
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
    // Show all tenants to allow reassignment from one room to another
    // The backend will handle updating both old and new room statuses
    return tenants;
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "ยืนยันการลบห้อง?",
      description: "การลบห้องนี้จะไม่สามารถกู้คืนได้",
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
      onConfirm: async () => {
        try {
          const { id: _, ...tenantWithoutId } = tenant;
          await updateTenantMutation.mutateAsync({
            id: tenant.id,
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
          // Explicitly refetch to ensure data is fresh
          await queryClient.refetchQueries({ queryKey: ["rooms"] });
          await queryClient.refetchQueries({ queryKey: ["tenants"] });
        } catch (error) {
          console.error("Failed to unassign tenant:", error);
        }
      },
    });
  };

  const handleSubmitAssignment = async () => {
    if (!selectedTenantId || !selectedRoom) return;

    try {
      // Update the room with tenantId and set status to OCCUPIED
      await updateRoomMutation.mutateAsync({
        id: selectedRoom.id,
        updates: {
          roomNumber: selectedRoom.roomNumber,
          buildingId: selectedRoom.buildingId,
          floor: selectedRoom.floor,
          status: "OCCUPIED",
          monthlyRent: selectedRoom.monthlyRent,
          size: selectedRoom.size,
          tenantId: selectedTenantId,
        },
      });
      // Explicitly refetch to ensure data is fresh
      await queryClient.refetchQueries({ queryKey: ["rooms"] });
      await queryClient.refetchQueries({ queryKey: ["tenants"] });
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
    if (!user?.teamId) {
      throw new Error("ไม่พบข้อมูลทีม");
    }
    try {
      // Create tenant first
      const newTenantResult = await createTenantMutation.mutateAsync({
        ...newTenant,
        roomId: selectedRoom.id,
        monthlyRent: selectedRoom.monthlyRent || "0",
        deposit: "0",
        status: TenantStatus.ACTIVE,
        teamId: user.teamId,
      });
      
      // Then update the room with the new tenant's ID and set status to OCCUPIED
      if (newTenantResult?.id) {
        await updateRoomMutation.mutateAsync({
          id: selectedRoom.id,
          updates: {
            roomNumber: selectedRoom.roomNumber,
            buildingId: selectedRoom.buildingId,
            floor: selectedRoom.floor,
            status: "OCCUPIED",
            monthlyRent: selectedRoom.monthlyRent,
            size: selectedRoom.size,
            tenantId: newTenantResult.id,
          },
        });
      }
      
      // Explicitly refetch to ensure data is fresh
      await queryClient.refetchQueries({ queryKey: ["rooms"] });
      await queryClient.refetchQueries({ queryKey: ["tenants"] });
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
                ? "bg-slate-500/10 text-slate-600"
                : room.status === "vacant"
                  ? "bg-slate-400/10 text-slate-600"
                  : "bg-slate-500/10 text-slate-600"
            }`}
          >
            {room.status === "occupied" && <User className="h-3 w-3" />}
            {getRoomStatusLabel(room.status)}
          </span>
          {room.status === "occupied" && (
            <div className="text-xs text-muted-foreground">
              {getTenantName(room)}
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

        {loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`room-stat-${index}`} className="rounded-xl border bg-card p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-7 w-16" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <Skeleton className="h-10 w-56" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`room-row-${index}`} className="rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : rooms.length === 0 ? (
          <EmptyState
            title="ยังไม่มีห้องพัก"
            description="เริ่มเพิ่มห้องเพื่อจัดการผู้เช่าและการอ่านมิเตอร์"
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/overview/rooms/bulk")}
                >
                  เพิ่มหลายห้อง
                </Button>
                <Button onClick={() => router.push("/overview/rooms/new")}>
                  เพิ่มห้อง
                </Button>
              </div>
            }
            variant="page"
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  จำนวนห้องทั้งหมด
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {totalRooms}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  เข้าพัก
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-600">
                  {rooms.filter((room) => room.status === "occupied").length}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ว่าง
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-600">
                  {rooms.filter((room) => room.status === "vacant").length}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ซ่อมบำรุง
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-600">
                  {rooms.filter((room) => room.status === "maintenance").length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
              <DataTable
                data={rooms}
                columns={columns}
                searchPlaceholder="ค้นหาห้อง..."
                filters={filters}
                pageSize={4}
                forcePagination
                pagination={{
                  page,
                  limit,
                  total: roomsMeta.total,
                  hasMore: roomsMeta.hasMore,
                  onPageChange: setPage,
                }}
              />
            </div>
          </>
        )}
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
              <div className="space-y-4">
                <Select
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                  disabled={isMutating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้เช่า" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTenants().map((tenant) => {
                      const currentRoom = tenant.roomId
                        ? rooms.find((r) => r.id === tenant.roomId)
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
                            <p className="text-xs text-muted-foreground">ชื่อ</p>
                            <p className="text-sm font-medium text-foreground">
                              {selectedTenant.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">อีเมล</p>
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
                          {selectedTenant.moveInDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">
                                วันที่เข้าพัก
                              </p>
                              <p className="text-sm text-foreground">
                                {new Date(selectedTenant.moveInDate).toLocaleDateString(
                                  "th-TH",
                                )}
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
                                  rooms.find((r) => r.id === selectedTenant.roomId)
                                    ?.roomNumber || selectedTenant.roomId
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
                  {getTenantByRoom(detailsRoom) ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        {getTenantByRoom(detailsRoom)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTenantByRoom(detailsRoom)?.email}
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
