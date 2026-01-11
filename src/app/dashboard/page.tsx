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
  settingsApi,
  tenantsApi,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { MeterReadingGroup, Tenant } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  usePageTitle("ภาพรวม");

  const { user } = useAuth();
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
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("จำเป็นต้องมี Team ID เพื่อโหลด Settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });

  const tenants = tenantsQuery.data?.tenants ?? [];
  const rooms = roomsQuery.data?.rooms ?? [];
  const readings = readingsQuery.data?.readings ?? [];
  const invoices = invoicesQuery.data?.invoices ?? [];
  const buildings = buildingsQuery.data?.buildings ?? [];
  const settingsConfigured = Boolean(settingsQuery.data?.settings);
  const isLoading =
    tenantsQuery.isLoading ||
    roomsQuery.isLoading ||
    readingsQuery.isLoading ||
    invoicesQuery.isLoading ||
    buildingsQuery.isLoading ||
    settingsQuery.isLoading;

  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingReadings = (readings as MeterReadingGroup[]).filter(
    (r) => r.status === "pending" || r.status === "incomplete",
  ).length;

  const stats = [
    {
      id: "tenants",
      title: "ผู้เช่าทั้งหมด",
      value: tenants.length,
      description: `${tenants.filter((t) => t.status === "active").length} ผู้เช่าที่กำลังอยู่`,
      icon: Users,
      trend: { value: 12, label: "เทียบเดือนที่แล้ว" },
    },
    {
      id: "occupied-rooms",
      title: "ห้องที่มีผู้เช่า",
      value: `${occupiedRooms}/${rooms.length}`,
      description: `${rooms.length ? ((occupiedRooms / rooms.length) * 100).toFixed(0) : "0"}% มีผู้เช่า`,
      icon: Home,
      trend: { value: 8, label: "เทียบเดือนที่แล้ว" },
    },
    {
      id: "pending-readings",
      title: "การอ่านที่ค้างอยู่",
      value: pendingReadings,
      description: "รอออกบิลหรือขาดมิเตอร์",
      icon: Gauge,
    },
    {
      id: "monthly-revenue",
      title: "รายได้ประจำเดือน",
      value: formatCurrency(totalRevenue),
      description: "จากใบแจ้งหนี้เดือนนี้",
      icon: DollarSign,
      trend: { value: 15, label: "เทียบเดือนที่แล้ว" },
      iconClassName: "bg-green-500/10",
    },
  ];

  const tenantColumns = [
    {
      key: "name",
      header: "ผู้เช่า",
      searchable: true,
      render: (tenant: Tenant) => (
        <span className="font-medium text-foreground">{tenant.name}</span>
      ),
    },
    {
      key: "email",
      header: "อีเมล",
      searchable: true,
      className: "hidden md:table-cell",
      render: (tenant: Tenant) => (
        <span className="text-sm text-muted-foreground">{tenant.email}</span>
      ),
    },
    {
      key: "phone",
      header: "โทรศัพท์",
      searchable: true,
      className: "hidden lg:table-cell",
      render: (tenant: Tenant) => (
        <span className="text-sm text-muted-foreground">{tenant.phone}</span>
      ),
    },
    {
      key: "room",
      header: "ห้อง",
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
      <PageHeader title="ภาพรวม" description="ภาพรวมการจัดการ StayKha ของคุณ" />

      <OnboardingChecklist
        buildingsCount={buildings.length}
        roomsCount={rooms.length}
        settingsConfigured={settingsConfigured}
        tenantsCount={tenants.length}
        readingsCount={readings.length}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ผู้เช่าล่าสุด</span>
              <Badge variant="secondary" className="font-normal">
                {tenants.length} ทั้งหมด
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="กำลังโหลดผู้เช่า..." />
            ) : tenants.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                ยังไม่มีผู้เช่า
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
              <span>การอ่านมิเตอร์ล่าสุด</span>
              <Badge variant="secondary" className="font-normal">
                {readings.length} เดือนนี้
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState message="กำลังโหลดการอ่านมิเตอร์..." />
            ) : readings.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                ยังไม่มีการอ่านมิเตอร์
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
                            ห้อง {reading.roomNumber} • การอ่านรายเดือน
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
