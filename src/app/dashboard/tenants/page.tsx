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
  usePageTitle("Tenants");

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

  const getRoomInfo = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? `${room.roomNumber} (${room.buildingName})` : "—";
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      open: true,
      title: "Delete tenant?",
      description:
        "This will permanently remove the tenant and cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
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
      header: "Tenant Name",
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
      header: "Room",
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
      header: "Contact",
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
      header: "Move-in Date",
      render: (tenant: Tenant) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(tenant.moveInDate)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (tenant: Tenant) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            tenant.status === "active"
              ? "bg-green-500/10 text-green-500"
              : "bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {tenant.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (tenant: Tenant) => (
        <TableRowActions
          primary={{
            label: "View",
            icon: Eye,
            onClick: () => router.push(`/overview/tenants/${tenant.id}/edit`),
          }}
          items={[
            {
              label: "Edit tenant",
              icon: Edit,
              onClick: () => router.push(`/overview/tenants/${tenant.id}/edit`),
            },
            {
              label: "Remove tenant",
              icon: Trash2,
              destructive: true,
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
      label: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Expired", value: "expired" },
      ],
      filterFn: (tenant: Tenant, value: string) => tenant.status === value,
    },
  ];

  if (loading) {
    return <LoadingState fullScreen message="Loading tenants..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage tenant information and assignments."
        actions={
          <Button
            onClick={() => router.push("/overview/tenants/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Tenant
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
        <DataTable
          data={tenants}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search tenants..."
          pageSize={10}
          forcePagination
        />
      </div>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Confirm"
        onConfirm={() => {
          const action = confirmState.onConfirm;
          setConfirmState((prev) => ({ ...prev, open: false }));
          action?.();
        }}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
