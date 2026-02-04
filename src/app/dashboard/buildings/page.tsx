"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Edit,
  Home,
  LayoutGrid,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { AdminRestrictionBanner } from "@/components/admin-restriction-banner";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { buildingsApi } from "@/lib/api-client";
import { getList, getPaginationMeta } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import type { Building } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatDate } from "@/lib/utils";

export default function BuildingsPage() {
  usePageTitle("อาคาร");

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const limit = 10;
  const buildingsQuery = useQuery({
    queryKey: ["buildings", page, limit],
    queryFn: () => buildingsApi.getAll(undefined, { page, limit }),
  });
  const buildings = getList(buildingsQuery.data);
  const buildingsMeta = getPaginationMeta(buildingsQuery.data);
  const isLoading = buildingsQuery.isLoading;
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const deleteBuildingMutation = useMutation({
    mutationFn: (id: string) => buildingsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast({
        title: "สำเร็จ",
        description: "ลบอาคารเรียบร้อย",
      });
    },
  });
  const isDeleting = deleteBuildingMutation.isPending;

  const handleDelete = async (id: string) => {
    try {
      await deleteBuildingMutation.mutateAsync(id);
    } catch (_error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ลบอาคารไม่สำเร็จ",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: "name" as keyof Building,
      header: "ชื่ออาคาร",
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
      header: "ชั้น",
      render: (building: Building) => (
        <span className="text-foreground">{building.totalFloors}</span>
      ),
      searchable: false,
    },
    {
      key: "totalRooms" as keyof Building,
      header: "จำนวนห้อง",
      render: (building: Building) => (
        <span className="text-foreground">{building.totalRooms}</span>
      ),
      searchable: false,
    },
    {
      key: "occupiedRooms" as keyof Building,
      header: "การเข้าพัก",
      render: (building: Building) => (
        <div>
          <p className="font-medium text-foreground">
            {building.occupiedRooms} / {building.totalRooms}
          </p>
          <p className="text-sm text-muted-foreground">
            {Math.round((building.occupiedRooms / building.totalRooms) * 100)}%
            เข้าพัก
          </p>
        </div>
      ),
    },
    {
      key: "createdAt" as keyof Building,
      header: "วันที่สร้าง",
      render: (building: Building) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(building.createdAt)}
        </span>
      ),
      searchable: false,
    },
    {
      key: "id" as keyof Building,
      header: "การดำเนินการ",
      render: (building: Building) => (
        <TableRowActions
          primary={{
            label: "ผังห้อง",
            icon: LayoutGrid,
            onClick: () =>
              router.push(`/overview/buildings/${building.id}/floor-plan`),
          }}
          items={[
            {
              label: "แก้ไขอาคาร",
              icon: Edit,
              onClick: () =>
                router.push(`/overview/buildings/${building.id}/edit`),
            },
            {
              label: "ลบ",
              icon: Trash2,
              destructive: true,
              disabled: isDeleting,
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
        <PageHeader title="อาคาร" description="จัดการข้อมูลอาคารของคุณ" />
        <AdminRestrictionBanner
          title="ต้องให้เจ้าของดำเนินการ"
          message="เฉพาะเจ้าของเท่านั้นที่สามารถสร้างและจัดการอาคารได้ โปรดติดต่อเจ้าของทีมเพื่อสร้างอาคาร"
          action="เมื่อมีอาคารแล้ว คุณสามารถสร้างห้องและจัดการผู้เช่าในอาคารนั้นได้"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="อาคาร"
        description="จัดการข้อมูลอาคารของคุณ"
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/overview/settings" search={{ section: "import" }}>
                นำเข้าข้อมูล
              </Link>
            </Button>
            <Button onClick={() => router.push("/overview/buildings/new")}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มอาคาร
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-10 w-56" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`building-row-${index}`} className="rounded-lg border p-3">
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
      ) : buildings.length === 0 ? (
        <EmptyState
          icon={<Home className="h-8 w-8 text-muted-foreground" />}
          title="ยังไม่มีอาคาร"
          description="เริ่มต้นด้วยการเพิ่มอาคารแรกของคุณ"
          actionLabel="เพิ่มอาคาร"
          onAction={() => router.push("/overview/buildings/new")}
          variant="page"
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <DataTable
            columns={columns}
            data={buildings}
            searchPlaceholder="ค้นหาอาคาร..."
            forcePagination
            pagination={{
              page,
              limit,
              total: buildingsMeta.total,
              hasMore: buildingsMeta.hasMore,
              onPageChange: setPage,
            }}
          />
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบอาคารนี้จะไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังลบ...
                </span>
              ) : (
                "ลบ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
