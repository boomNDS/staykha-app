"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { FloorPlanView } from "@/components/floor-plan-view";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildingsApi, roomsApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import type { Building, Room } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function BuildingFloorPlanPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;
  usePageTitle(`Floor Plan ${buildingId}`);
  const buildingQuery = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => buildingsApi.getById(buildingId),
    enabled: Boolean(buildingId),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const building = buildingQuery.data?.building ?? null;
  const rooms = (roomsQuery.data?.rooms ?? []).filter(
    (room: Room) => room.buildingId === buildingId,
  );
  const isLoading = buildingQuery.isLoading || roomsQuery.isLoading;

  const handleRoomClick = (room: Room) => {
    router.push(`/overview/rooms/${room.id}/edit`);
  };

  const columns = [
    {
      key: "roomNumber" as keyof Room,
      header: "Room",
      render: (room: Room) => (
        <span className="font-medium text-foreground">{room.roomNumber}</span>
      ),
    },
    {
      key: "floor" as keyof Room,
      header: "Floor",
      render: (room: Room) => (
        <span className="text-muted-foreground">Floor {room.floor}</span>
      ),
    },
    {
      key: "status" as keyof Room,
      header: "Status",
      render: (room: Room) => (
        <Badge
          variant={
            room.status === "occupied"
              ? "default"
              : room.status === "vacant"
                ? "secondary"
                : "outline"
          }
        >
          {room.status}
        </Badge>
      ),
    },
    {
      key: "size" as keyof Room,
      header: "Size",
      render: (room: Room) => (
        <span className="text-muted-foreground">{room.size || "-"} m²</span>
      ),
    },
    {
      key: "monthlyRent" as keyof Room,
      header: "Rent",
      render: (room: Room) => (
        <span className="text-foreground">
          ฿{room.monthlyRent?.toLocaleString() || "-"}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingState fullScreen message="Loading building data..." />;
  }

  if (!building) {
    return <div className="text-center py-12">Building not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={building.name}
        description={building.address}
        showBack
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Rooms</p>
          <p className="text-2xl font-bold text-foreground">{rooms.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Occupied</p>
          <p className="text-2xl font-bold text-emerald-600">
            {rooms.filter((r) => r.status === "occupied").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Occupancy Rate</p>
          <p className="text-2xl font-bold text-foreground">
            {rooms.length > 0
              ? Math.round(
                  (rooms.filter((r) => r.status === "occupied").length /
                    rooms.length) *
                    100,
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="floorplan" className="space-y-6">
        <TabsList>
          <TabsTrigger value="floorplan" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Floor Plan
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floorplan" className="space-y-4">
          <FloorPlanView
            rooms={rooms}
            buildingName={building.name}
            onRoomClick={handleRoomClick}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <DataTable
              columns={columns}
              data={rooms}
              searchable={false}
              searchPlaceholder="Search rooms..."
              forcePagination
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
