"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, Gauge, Home, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { LoadingState } from "@/components/loading-state";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildingsApi,
  invoicesApi,
  readingsApi,
  roomsApi,
  tenantsApi,
} from "@/lib/api-client";
import type { MeterReadingGroup, Tenant } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  usePageTitle("Overview");

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll(),
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const readingsQuery = useQuery({
    queryKey: ["readings"],
    queryFn: () => readingsApi.getAll(),
  });
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
  });
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.getAll(),
  });

  const tenants = tenantsQuery.data?.tenants ?? [];
  const rooms = roomsQuery.data?.rooms ?? [];
  const readings = readingsQuery.data?.readings ?? [];
  const invoices = invoicesQuery.data?.invoices ?? [];
  const buildings = buildingsQuery.data?.buildings ?? [];
  const isLoading =
    tenantsQuery.isLoading ||
    roomsQuery.isLoading ||
    readingsQuery.isLoading ||
    invoicesQuery.isLoading ||
    buildingsQuery.isLoading;

  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingReadings = (readings as MeterReadingGroup[]).filter(
    (r) => r.status === "pending" || r.status === "incomplete",
  ).length;

  const stats = [
    {
      title: "Total Tenants",
      value: tenants.length,
      description: `${tenants.filter((t) => t.status === "active").length} active tenants`,
      icon: Users,
      trend: { value: 12, label: "vs last month" },
    },
    {
      title: "Occupied Rooms",
      value: `${occupiedRooms}/${rooms.length}`,
      description: `${rooms.length ? ((occupiedRooms / rooms.length) * 100).toFixed(0) : "0"}% occupancy`,
      icon: Home,
      trend: { value: 8, label: "vs last month" },
    },
    {
      title: "Pending Readings",
      value: pendingReadings,
      description: "Awaiting billing or missing meter",
      icon: Gauge,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(totalRevenue),
      description: "From invoices this month",
      icon: DollarSign,
      trend: { value: 15, label: "vs last month" },
      iconClassName: "bg-green-500/10",
    },
  ];

  const tenantColumns = [
    {
      key: "name",
      header: "Tenant",
      searchable: true,
      render: (tenant: Tenant) => (
        <span className="font-medium text-foreground">{tenant.name}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      searchable: true,
      className: "hidden md:table-cell",
      render: (tenant: Tenant) => (
        <span className="text-sm text-muted-foreground">{tenant.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      searchable: true,
      className: "hidden lg:table-cell",
      render: (tenant: Tenant) => (
        <span className="text-sm text-muted-foreground">{tenant.phone}</span>
      ),
    },
    {
      key: "room",
      header: "Room",
      searchable: true,
      render: (tenant: Tenant) => {
        const room = rooms.find((r) => r.id === tenant.roomId);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {room?.roomNumber || tenant.roomId}
            </span>
            <span className="text-xs text-muted-foreground">
              {room?.buildingName || "—"}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <PageHeader
        title="Overview"
        description="Overview of your StayKha operations."
      />

      <OnboardingChecklist
        buildingsCount={buildings.length}
        roomsCount={rooms.length}
        tenantsCount={tenants.length}
        readingsCount={readings.length}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Tenants</span>
              <Badge variant="secondary" className="font-normal">
                {tenants.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="Loading tenants..." />
            ) : tenants.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No tenants found
              </div>
            ) : (
              <DataTable
                data={tenants.slice(0, 5)}
                columns={tenantColumns}
                pageSize={5}
                hideSearch
                hidePagination
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Readings</span>
              <Badge variant="secondary" className="font-normal">
                {readings.length} this month
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="Loading readings..." />
            ) : readings.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No readings found
              </div>
            ) : (
              <div className="space-y-3">
                {(readings as MeterReadingGroup[])
                  .slice(0, 5)
                  .map((reading) => (
                    <div
                      key={reading.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-muted p-2">
                          <Gauge className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {reading.tenantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Room {reading.roomNumber} • Monthly readings
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {reading.water
                            ? `${reading.water.consumption} m³`
                            : "—"}{" "}
                          /{" "}
                          {reading.electric
                            ? `${reading.electric.consumption} kWh`
                            : "—"}
                        </p>
                        <Badge
                          variant={
                            reading.status === "incomplete"
                              ? "outline"
                              : reading.status === "pending"
                                ? "secondary"
                                : "default"
                          }
                          className="text-xs"
                        >
                          {reading.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
