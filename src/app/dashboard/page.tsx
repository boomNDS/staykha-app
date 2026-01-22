"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { DollarSign, Gauge, Home, Users } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { LoadingState } from "@/components/loading-state";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { overviewApi, settingsApi } from "@/lib/api-client";
import { getData } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import type { MeterReadingGroup } from "@/lib/types";
import { InvoiceStatus, TenantStatus } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  usePageTitle("ภาพรวม");

  const { user } = useAuth();
  const hasTeam = !!user?.teamId;
  
  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () => overviewApi.get(),
    enabled: hasTeam,
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

  const overview = overviewQuery.data;
  const settingsConfigured = Boolean(getData(settingsQuery.data));
  const isLoading = overviewQuery.isLoading || settingsQuery.isLoading;

  // Extract data from overview response
  const summary = overview?.summary;
  const revenue = overview?.revenue;
  const recentInvoices = overview?.recentInvoices ?? [];
  const pendingReadingsList = overview?.pendingReadings ?? [];

  const occupiedRooms = summary?.rooms.byStatus.OCCUPIED ?? 0;
  const totalRevenue = revenue?.totalPaid ? (typeof revenue.totalPaid === "string" ? Number.parseFloat(revenue.totalPaid) : revenue.totalPaid) : 0;
  const pendingReadings = (summary?.readingGroups.byStatus.INCOMPLETE ?? 0) + (summary?.readingGroups.byStatus.PENDING ?? 0);
  const readingStatusLabels: Record<MeterReadingGroup["status"], string> = {
    pending: "รอตรวจ",
    incomplete: "ข้อมูลไม่ครบ",
    billed: "ออกบิลแล้ว",
    paid: "ชำระแล้ว",
  };

  const stats = [
    {
      id: "tenants",
      title: "ผู้เช่าทั้งหมด",
      value: summary?.tenants.total ?? 0,
      description: `${summary?.tenants.byStatus.ACTIVE ?? 0} ผู้เช่าที่กำลังอยู่`,
      icon: Users,
      trend: { value: 12, label: "เทียบเดือนที่แล้ว" },
    },
    {
      id: "occupied-rooms",
      title: "ห้องที่มีผู้เช่า",
      value: `${occupiedRooms}/${summary?.rooms.total ?? 0}`,
      description: `${summary?.rooms.total ? ((occupiedRooms / summary.rooms.total) * 100).toFixed(0) : "0"}% มีผู้เช่า`,
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
      iconClassName: "bg-slate-500/10",
    },
  ];

  const primaryAction =
    (summary?.buildings ?? 0) === 0
      ? { label: "สร้างอาคารใหม่", href: "/overview/buildings/new" }
      : (summary?.rooms.total ?? 0) === 0
        ? { label: "เพิ่มห้องพัก", href: "/overview/rooms/new" }
        : { label: "บันทึกการอ่านมิเตอร์", href: "/overview/readings/new" };


  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <PageHeader
        title="ภาพรวม"
        description="ภาพรวมการจัดการ StayKha ของคุณ"
        actions={
          <Button asChild>
            <Link to={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        }
      />

      <OnboardingChecklist
        buildingsCount={summary?.buildings ?? 0}
        roomsCount={summary?.rooms.total ?? 0}
        settingsConfigured={settingsConfigured}
        tenantsCount={summary?.tenants.total ?? 0}
        readingsCount={summary?.readingGroups.total ?? 0}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`stat-skeleton-${index}`} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </Card>
            ))
          : stats.map((stat) => <StatCard key={stat.id} {...stat} />)}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>ผู้เช่าล่าสุด</span>
              <Badge variant="secondary" className="font-normal">
                {summary?.tenants.total ?? 0} ทั้งหมด
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`tenant-skeleton-${index}`} className="rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (summary?.tenants.total ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-sm text-muted-foreground">
                <p>ยังไม่มีผู้เช่า เริ่มเพิ่มรายชื่อเพื่อจัดการสัญญาได้ทันที</p>
                <Button asChild>
                  <Link to="/overview/tenants/new">เพิ่มผู้เช่า</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <Users className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {invoice.tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.room.roomNumber} • {invoice.room.building.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(typeof invoice.total === "string" ? Number.parseFloat(invoice.total) : invoice.total)}
                      </p>
                      <Badge
                        variant={
                          invoice.status === InvoiceStatus.PAID
                            ? "default"
                            : invoice.status === InvoiceStatus.PENDING
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {invoice.status === InvoiceStatus.PAID
                          ? "ชำระแล้ว"
                          : invoice.status === InvoiceStatus.PENDING
                            ? "รอชำระ"
                            : invoice.status === InvoiceStatus.SENT
                              ? "ส่งแล้ว"
                              : invoice.status === InvoiceStatus.OVERDUE
                                ? "ค้างชำระ"
                                : "ร่าง"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && (summary?.tenants.total ?? 0) > 0 && (
              <div className="mt-4 flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/overview/tenants">ดูทั้งหมด</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>การอ่านมิเตอร์ล่าสุด</span>
              <Badge variant="secondary" className="font-normal">
                {pendingReadingsList.length} เดือนนี้
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`reading-skeleton-${index}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (summary?.readingGroups.total ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center text-sm text-muted-foreground">
                <p>ยังไม่มีการอ่านมิเตอร์ เพิ่มการอ่านเพื่อเริ่มออกบิลได้ทันที</p>
                <Button asChild>
                  <Link to="/overview/readings/new">เพิ่มการอ่านมิเตอร์</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReadingsList.slice(0, 5).map((reading) => (
                  <div
                    key={reading.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <Gauge className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {reading.tenantName || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ห้อง {reading.roomNumber} • {reading.buildingName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {reading.water
                          ? `${typeof reading.water.consumption === "string" ? Number.parseFloat(reading.water.consumption) : reading.water.consumption} m³`
                          : "—"}{" "}
                        /{" "}
                        {reading.electric
                          ? `${typeof reading.electric.consumption === "string" ? Number.parseFloat(reading.electric.consumption) : reading.electric.consumption} kWh`
                          : "—"}
                      </p>
                      <Badge
                        variant={
                          reading.status === "INCOMPLETE"
                            ? "outline"
                            : reading.status === "PENDING"
                              ? "secondary"
                              : "default"
                        }
                        className="text-xs"
                      >
                        {reading.status === "INCOMPLETE"
                          ? "ข้อมูลไม่ครบ"
                          : reading.status === "PENDING"
                            ? "รอตรวจ"
                            : reading.status === "BILLED"
                              ? "ออกบิลแล้ว"
                              : "ชำระแล้ว"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && (summary?.readingGroups.total ?? 0) > 0 && (
              <div className="mt-4 flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/overview/readings">ดูทั้งหมด</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
