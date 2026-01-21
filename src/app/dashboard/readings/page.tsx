"use client";

import { Gauge, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsRequired } from "@/components/settings-required";
import { useReadingsPage } from "@/lib/hooks/use-readings-page";
import type { MeterReadingGroup, Room } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function ReadingsPage() {
  usePageTitle("อ่านมิเตอร์");

  const {
    buildingsQuery,
    settingsQuery,
    roomsQuery,
    readings,
    buildings,
    rooms,
    settings,
    isLoading,
    isWaterFixed,
    selectedPeriod,
    setSelectedPeriod,
    setSelectedGroupId,
    generatingInvoiceId,
    setGeneratingInvoiceId,
    periodOptions,
    filteredReadings,
    selectedGroup,
    hasMixedPeriods,
    monthLabel,
    selectedGroupMonthLabel,
    selectedGroupRoomLabel,
    selectedGroupStatus,
    hasExistingInvoice,
    isInvoiceReady,
    missingReadingsLabel,
    missingReadings,
    getStatusColor,
    formatDateParam,
    todayValue,
    columns,
    filters,
    generateInvoiceMutation,
    router,
  } = useReadingsPage();

  // Early returns for settings and rooms
  if (settingsQuery.isSuccess && !settings) {
    return (
      <SettingsRequired
        title="ต้องตั้งค่า Settings ก่อนใช้งาน"
        description="คุณต้องสร้าง Settings ของทีมก่อนจึงจะดูการอ่านมิเตอร์ได้"
      />
    );
  }

  if (roomsQuery.isSuccess && rooms.length === 0) {
    const actionHref =
      buildingsQuery.isSuccess && buildings.length === 0
        ? "/overview/buildings/new"
        : "/overview/rooms/new";
    const actionLabel =
      buildingsQuery.isSuccess && buildings.length === 0
        ? "สร้างอาคาร"
        : "เพิ่มห้อง";

    return (
      <EmptyState
        icon={<Gauge className="h-8 w-8 text-muted-foreground" />}
        title="ต้องสร้างห้องก่อนอ่านมิเตอร์"
        description="ยังไม่มีห้องในระบบ กรุณาสร้างอาคารและเพิ่มห้องก่อนจึงจะบันทึกการอ่านมิเตอร์ได้"
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      {/* Loading overlay when generating invoice */}
      {generateInvoiceMutation.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">กำลังสร้างใบแจ้งหนี้</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
              <LoadingState message="กรุณารอสักครู่ ระบบกำลังสร้างใบแจ้งหนี้ให้คุณ..." />
            </CardContent>
          </Card>
        </div>
      )}

      <PageHeader
        title="อ่านมิเตอร์"
        description="บันทึกค่าน้ำและค่าไฟพร้อมกัน หรืออัปเดตทีละมิเตอร์ภายหลังได้"
        actions={
          <>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="เลือกงวดบิล" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(
                  (option: { value: string; label: string }) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={() => router.push("/overview/readings/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มการอ่านมิเตอร์
            </Button>
          </>
        }
      />

      {hasMixedPeriods ? (
        <Alert>
          <AlertTitle>มีการอ่านหลายงวด</AlertTitle>
          <AlertDescription>
            มีการอ่านมิเตอร์หลายเดือนในรายการนี้ โปรดเลือกงวดบิลก่อนสร้างใบแจ้งหนี้
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายการอ่านมิเตอร์ทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {filteredReadings.length}
            </div>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รอออกบิล
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                filteredReadings.filter(
                  (group: MeterReadingGroup) => group.status === "pending",
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">รอสร้างบิล</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ไม่ครบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                filteredReadings.filter(
                  (group: MeterReadingGroup) => group.status === "incomplete",
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">ขาดมิเตอร์บางรายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ออกบิลแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                filteredReadings.filter(
                  (group: MeterReadingGroup) => group.status === "billed",
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>รายละเอียดกลุ่ม</CardTitle>
            <CardDescription>ตรวจสอบห้องและรอบบิลก่อนสร้างใบแจ้งหนี้</CardDescription>
          </div>
          <div className="min-w-[200px]">
            <Select
              value={selectedGroup?.id ?? ""}
              onValueChange={(value) => setSelectedGroupId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกห้อง" />
              </SelectTrigger>
              <SelectContent>
                {filteredReadings.map((group: MeterReadingGroup) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.roomNumber} •{" "}
                    {new Date(group.readingDate).toLocaleString("th-TH", {
                      month: "short",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedGroup ? (
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ห้องและงวด
                </p>
                <p className="text-lg font-semibold text-foreground">
                  ห้อง {selectedGroupRoomLabel}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedGroupMonthLabel}
                </p>
                <Badge
                  variant={getStatusColor(selectedGroupStatus)}
                  className="mt-3"
                >
                  {selectedGroupStatus === "pending"
                    ? "รอออกบิล"
                    : selectedGroupStatus === "incomplete"
                      ? "ไม่ครบ"
                      : selectedGroupStatus === "billed"
                        ? "ออกบิลแล้ว"
                        : selectedGroupStatus === "paid"
                          ? "ชำระแล้ว"
                          : selectedGroupStatus}
                </Badge>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  น้ำ
                </p>
                <p className="text-2xl font-semibold text-slate-600">
                  {selectedGroup.water
                    ? `${selectedGroup.water.consumption.toLocaleString()} m³`
                    : isWaterFixed
                      ? "เหมาจ่าย"
                      : "ยังไม่บันทึก"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGroup.water
                    ? `ก่อนหน้า ${selectedGroup.water.previousReading} • ล่าสุด ${selectedGroup.water.currentReading}`
                    : isWaterFixed
                      ? "เหมาจ่ายรายเดือน"
                      : "รอการอ่านมิเตอร์"}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ไฟ
                </p>
                <p className="text-2xl font-semibold text-slate-600">
                  {selectedGroup.electric
                    ? `${selectedGroup.electric.consumption.toLocaleString()} kWh`
                    : "ยังไม่บันทึก"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGroup.electric
                    ? `ก่อนหน้า ${selectedGroup.electric.previousReading} • ล่าสุด ${selectedGroup.electric.currentReading}`
                    : "รอการอ่านมิเตอร์ไฟ"}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    การดำเนินการ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/overview/readings/${selectedGroup.id}`)
                      }
                    >
                      ดูรายละเอียด
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!isInvoiceReady || hasExistingInvoice) return;
                        setGeneratingInvoiceId(selectedGroup.id);
                        generateInvoiceMutation.mutate(selectedGroup.id);
                      }}
                      disabled={
                        !isInvoiceReady ||
                        hasExistingInvoice ||
                        generatingInvoiceId === selectedGroup.id ||
                        generateInvoiceMutation.isPending
                      }
                      title={
                        hasExistingInvoice
                          ? "มีใบแจ้งหนี้แล้วสำหรับกลุ่มนี้"
                          : !isInvoiceReady
                            ? "กรุณากรอกการอ่านให้ครบก่อน"
                            : undefined
                      }
                    >
                      {hasExistingInvoice
                        ? "มีใบแจ้งหนี้แล้ว"
                        : generatingInvoiceId === selectedGroup.id
                          ? "กำลังสร้าง..."
                          : "สร้างใบแจ้งหนี้"}
                    </Button>
                  </div>
                  {!isInvoiceReady &&
                  !hasExistingInvoice &&
                  missingReadingsLabel ? (
                    <p className="text-xs text-muted-foreground">
                      ยังขาด: {missingReadingsLabel}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  รหัสกลุ่มการอ่าน:{" "}
                  <span className="font-mono">{selectedGroup.id}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีข้อมูลการอ่านมิเตอร์สำหรับสรุป
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการอ่านที่ขาด • {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {missingReadings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              ทุกห้องอัปเดตครบสำหรับ {monthLabel}
            </div>
          ) : (
            <DataTable
              data={missingReadings}
              columns={[
                {
                  key: "room",
                  header: "ห้อง",
                  searchable: true,
                  render: (item: {
                    room: Room;
                    currentGroup: MeterReadingGroup | null;
                    missingElectric: boolean;
                    missingWater: boolean;
                    hasMissing: boolean;
                  }) => (
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        ห้อง {item.room.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.room.buildingName}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "missing",
                  header: "ที่ขาด",
                  render: (item: {
                    room: Room;
                    currentGroup: MeterReadingGroup | null;
                    missingElectric: boolean;
                    missingWater: boolean;
                    hasMissing: boolean;
                  }) => (
                    <div className="flex flex-wrap gap-2">
                      {item.missingWater && <Badge variant="outline">น้ำ</Badge>}
                      {item.missingElectric && (
                        <Badge variant="outline">ไฟ</Badge>
                      )}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "การดำเนินการ",
                  render: (item: {
                    room: Room;
                    currentGroup: MeterReadingGroup | null;
                    missingElectric: boolean;
                    missingWater: boolean;
                    hasMissing: boolean;
                  }) => (
                    <div className="flex flex-wrap gap-2">
                      {item.missingWater && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (item.currentGroup) {
                              router.push(
                                `/overview/readings/${item.currentGroup.id}`,
                              );
                              return;
                            }
                            const dateParam = formatDateParam(todayValue);
                            router.push(
                              `/overview/readings/new?roomId=${item.room.id}&date=${dateParam}&meter=water`,
                            );
                          }}
                        >
                          เพิ่มมิเตอร์น้ำ
                        </Button>
                      )}
                      {item.missingElectric && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (item.currentGroup) {
                              router.push(
                                `/overview/readings/${item.currentGroup.id}`,
                              );
                              return;
                            }
                            const dateParam = formatDateParam(todayValue);
                            router.push(
                              `/overview/readings/new?roomId=${item.room.id}&date=${dateParam}&meter=electric`,
                            );
                          }}
                        >
                          เพิ่มมิเตอร์ไฟ
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              searchPlaceholder="ค้นหาห้อง..."
              pageSize={5}
              forcePagination
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการอ่านทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-64" />
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`reading-row-${index}`} className="rounded-lg border p-3">
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
          ) : readings.length === 0 ? (
            <EmptyState
              icon={<Gauge className="h-8 w-8 text-muted-foreground" />}
              title="ยังไม่มีการอ่านมิเตอร์"
              description="เริ่มติดตามการใช้สาธารณูปโภคด้วยการเพิ่มการอ่านครั้งแรก"
              actionLabel="เพิ่มการอ่านครั้งแรก"
              actionHref="/overview/readings/new"
            />
          ) : filteredReadings.length === 0 ? (
            <EmptyState
              icon={<Gauge className="h-8 w-8 text-muted-foreground" />}
              title="ยังไม่มีการอ่านในงวดนี้"
              description={`ยังไม่มีข้อมูลการอ่านมิเตอร์สำหรับ ${monthLabel}`}
              actionLabel="เพิ่มการอ่าน"
              actionHref="/overview/readings/new"
            />
          ) : (
            <DataTable
              data={filteredReadings}
              columns={columns}
              searchPlaceholder="ค้นหาตามผู้เช่า ห้อง หรือวันที่..."
              filters={filters}
              pageSize={10}
              forcePagination
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
