"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Home, LayoutGrid, MapPin, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { AdminRestrictionBanner } from "@/components/admin-restriction-banner";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TableRowActions } from "@/components/table-row-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import type { Building } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatDate } from "@/lib/utils";

export default function BuildingsPage() {
  usePageTitle("Buildings");

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const buildings = buildingsQuery.data?.buildings ?? [];
  const isLoading = buildingsQuery.isLoading;
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const deleteBuildingMutation = useMutation({
    mutationFn: (id: string) => buildingsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast({
        title: "Success",
        description: "Building deleted successfully",
      });
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteBuildingMutation.mutateAsync(id);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete building",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: "name" as keyof Building,
      header: "Building Name",
      render: (building: Building) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">{building.name}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {building.address}
            </p>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "totalFloors" as keyof Building,
      header: "Floors",
      render: (building: Building) => (
        <span className="text-foreground">{building.totalFloors}</span>
      ),
      searchable: false,
    },
    {
      key: "totalRooms" as keyof Building,
      header: "Total Rooms",
      render: (building: Building) => (
        <span className="text-foreground">{building.totalRooms}</span>
      ),
      searchable: false,
    },
    {
      key: "occupiedRooms" as keyof Building,
      header: "Occupancy",
      render: (building: Building) => (
        <div>
          <p className="font-medium text-foreground">
            {building.occupiedRooms} / {building.totalRooms}
          </p>
          <p className="text-sm text-muted-foreground">
            {Math.round((building.occupiedRooms / building.totalRooms) * 100)}%
            occupied
          </p>
        </div>
      ),
    },
    {
      key: "createdAt" as keyof Building,
      header: "Created",
      render: (building: Building) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(building.createdAt)}
        </span>
      ),
      searchable: false,
    },
    {
      key: "id" as keyof Building,
      header: "Actions",
      render: (building: Building) => (
        <TableRowActions
          primary={{
            label: "Floor plan",
            icon: LayoutGrid,
            onClick: () =>
              router.push(`/overview/buildings/${building.id}/floor-plan`),
          }}
          items={[
            {
              label: "Edit building",
              icon: Edit,
              onClick: () =>
                router.push(`/overview/buildings/${building.id}/edit`),
            },
            {
              label: "Delete",
              icon: Trash2,
              destructive: true,
              onClick: () => setDeleteId(building.id),
            },
          ]}
        />
      ),
    },
  ];

  // Check if user is owner - show banner for admins
  if (user?.role !== "owner") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Buildings"
          description="Manage your building properties."
        />
        <AdminRestrictionBanner
          title="Owner Action Required"
          message="Only owners can create and manage buildings. Please contact your team owner to create buildings."
          action="Once buildings are created, you can create rooms and manage tenants within those buildings."
        />
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState fullScreen message="Loading buildings..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildings"
        description="Manage your building properties."
        actions={
          <Button onClick={() => router.push("/overview/buildings/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Building
          </Button>
        }
      />

      {buildings.length === 0 ? (
        <EmptyState
          icon={<Home className="h-8 w-8 text-muted-foreground" />}
          title="No buildings yet"
          description="Get started by creating your first building"
          actionLabel="Add Building"
          onAction={() => router.push("/overview/buildings/new")}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <DataTable
            columns={columns}
            data={buildings}
            searchPlaceholder="Search buildings..."
            forcePagination
          />
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this building. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
