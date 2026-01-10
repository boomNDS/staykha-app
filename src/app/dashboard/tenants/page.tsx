"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Edit,
  Eye,
  Home,
  Mail,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { roomsApi, tenantsApi } from "@/lib/api-client";
import { useRouter } from "@/lib/router";
import type { Tenant } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatDate } from "@/lib/utils";

export default function TenantsPage() {
  usePageTitle("ผู้เช่า");

  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll(),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const tenants = tenantsQuery.data?.tenants ?? [];
  const rooms = roomsQuery.data?.rooms ?? [];
  const loading = tenantsQuery.isLoading || roomsQuery.isLoading;
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

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
  const isDeleting = deleteTenantMutation.isPending;

  const getRoomInfo = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? `${room.roomNumber} (${room.buildingName})` : "—";
  };

  const getTenantStatusLabel = (status: Tenant["status"]) => {
    switch (status) {
      case "active":
        return "ใช้งาน";
      case "inactive":
        return "ไม่ใช้งาน";
      case "expired":
        return "หมดสัญญา";
      default:
        return status;
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "ยืนยันการลบผู้เช่า?",
      description: "การลบผู้เช่านี้จะไม่สามารถกู้คืนได้",
      confirmLabel: "ลบ",
      cancelLabel: "ยกเลิก",
      onConfirm: async () => {
        try {
          await deleteTenantMutation.mutateAsync(id);
        } catch (error) {
          console.error("Failed to delete tenant:", error);
        }
      },
    });
  };

  const columns = [
    {
      key: "name",
      header: "ชื่อผู้เช่า",
      render: (tenant: Tenant) => (
        <div>
          <div className="font-medium text-foreground">{tenant.name}</div>
          {tenant.idCardNumber && (
            <div className="text-xs text-muted-foreground">
              ID: {tenant.idCardNumber}
            </div>
          )}
        </div>
      ),
      searchable: true,
    },
    {
      key: "roomNumber",
      header: "ห้อง",
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {getRoomInfo(tenant.roomId)}
          </span>
        </div>
      ),
      searchable: true,
    },
    {
      key: "email",
      header: "ติดต่อ",
      render: (tenant: Tenant) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{tenant.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{tenant.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: "moveInDate",
      header: "วันที่ย้ายเข้า",
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(tenant.moveInDate)}
        </div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (tenant: Tenant) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            tenant.status === "active"
              ? "bg-green-500/10 text-green-500"
              : "bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {getTenantStatusLabel(tenant.status)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (tenant: Tenant) => (
        <TableRowActions
          primary={{
            label: "ดูรายละเอียด",
            icon: Eye,
            onClick: () => router.push(`/overview/tenants/${tenant.id}/edit`),
          }}
          items={[
            {
              label: "แก้ไขผู้เช่า",
              icon: Edit,
              onClick: () => router.push(`/overview/tenants/${tenant.id}/edit`),
            },
            {
              label: "ลบผู้เช่า",
              icon: Trash2,
              destructive: true,
              disabled: isDeleting,
              onClick: () => handleDelete(tenant.id),
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
        { label: "ใช้งาน", value: "active" },
        { label: "ไม่ใช้งาน", value: "inactive" },
        { label: "หมดสัญญา", value: "expired" },
      ],
      filterFn: (tenant: Tenant, value: string) => tenant.status === value,
    },
  ];

  if (loading) {
    return <LoadingState fullScreen message="กำลังโหลดผู้เช่า..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ผู้เช่า"
        description="จัดการข้อมูลผู้เช่าและการผูกห้อง"
        actions={
          <Button
            onClick={() => router.push("/overview/tenants/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            เพิ่มผู้เช่า
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
        <DataTable
          data={tenants}
          columns={columns}
          filters={filters}
          searchPlaceholder="ค้นหาผู้เช่า..."
          pageSize={10}
          forcePagination
        />
      </div>
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
    </div>
  );
}
