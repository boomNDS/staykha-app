"use client";

import { useQuery } from "@tanstack/react-query";
import { Droplets, FileText, Gauge, Plus, Zap } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { SettingsRequired } from "@/components/settings-required";
import { TableRowActions } from "@/components/table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { invoicesApi, readingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import type { Invoice, MeterReadingGroup, Room } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function ReadingsPage() {
  usePageTitle("อ่านมิเตอร์");

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const readingsQuery = useQuery({
    queryKey: ["readings"],
    queryFn: () => readingsApi.getAll(),
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
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.getAll(),
  });
  const [reminderHistory, setReminderHistory] = React.useState<
    Record<string, string>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem("staykha:readingReminders");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    null,
  );
  const followUpStorageKey = "staykha:missingFollowUps";
  const [followUps, setFollowUps] = React.useState<Record<string, string>>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const stored = window.localStorage.getItem(followUpStorageKey);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    },
  );

  // All hooks must be called before any conditional returns
  const readings = readingsQuery.data?.readings ?? [];
  const rooms = roomsQuery.data?.rooms ?? [];
  const settings = settingsQuery.data?.settings;
  const isLoading = readingsQuery.isLoading;
  const waterBillingMode = settings?.waterBillingMode ?? "metered";
  const isWaterFixed = waterBillingMode === "fixed";
  const groupedReadings = readings as MeterReadingGroup[];

  // All useEffect and useMemo hooks must be called before any early returns
  React.useEffect(() => {
    if (!groupedReadings.length) {
      setSelectedGroupId(null);
      return;
    }
    if (
      !selectedGroupId ||
      !groupedReadings.some((group) => group.id === selectedGroupId)
    ) {
      setSelectedGroupId(groupedReadings[0].id);
    }
  }, [groupedReadings, selectedGroupId]);

  const selectedGroup = React.useMemo(() => {
    if (!groupedReadings.length) return null;
    return (
      groupedReadings.find((group) => group.id === selectedGroupId) ??
      groupedReadings[0]
    );
  }, [groupedReadings, selectedGroupId]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "staykha:readingReminders",
      JSON.stringify(reminderHistory),
    );
  }, [reminderHistory]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(followUpStorageKey, JSON.stringify(followUps));
  }, [followUps]);

  // Show settings required message if settings don't exist (AFTER all hooks)
  if (settingsQuery.isSuccess && !settings) {
    return (
      <SettingsRequired
        title="ต้องตั้งค่า Settings ก่อนใช้งาน"
        description="คุณต้องสร้าง Settings ของทีมก่อนจึงจะดูการอ่านมิเตอร์ได้"
      />
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "billed":
        return "default";
      case "pending":
        return "secondary";
      case "incomplete":
        return "outline";
      case "paid":
        return "default";
      default:
        return "secondary";
    }
  };

  const monthLabel = new Date().toLocaleString("th-TH", {
    month: "long",
    year: "numeric",
  });
  const monthKey = new Date().toISOString().slice(0, 7);
  const readingsByRoom = new Map<string, MeterReadingGroup[]>();
  groupedReadings.forEach((group) => {
    if (!readingsByRoom.has(group.roomId)) {
      readingsByRoom.set(group.roomId, []);
    }
    readingsByRoom.get(group.roomId)?.push(group);
  });

  const selectedGroupMonthLabel = selectedGroup
    ? new Date(selectedGroup.readingDate).toLocaleString("th-TH", {
        month: "long",
        year: "numeric",
      })
    : "";
  const selectedGroupRoomLabel = selectedGroup?.roomNumber ?? "—";
  const selectedGroupStatus = selectedGroup?.status ?? "pending";
  const invoices = invoicesQuery.data?.invoices ?? [];
  const hasExistingInvoice = selectedGroup
    ? invoices.some((invoice: Invoice) => invoice.readingGroupId === selectedGroup.id)
    : false;
  const isInvoiceReady =
    Boolean(selectedGroup?.electric) &&
    (isWaterFixed || Boolean(selectedGroup?.water)) &&
    !hasExistingInvoice;

  const _handleReminder = (roomId: string, type: "water" | "electric") => {
    const key = `${roomId}-${type}`;
    const timestamp = new Date().toISOString();
    setReminderHistory((prev) => {
      const next = { ...prev, [key]: timestamp };
      toast({
        title: "ตั้งค่าการแจ้งเตือนแล้ว",
        description: `ส่งการแจ้งเตือน${type === "water" ? "มิเตอร์น้ำ" : "มิเตอร์ไฟ"}ให้ห้อง ${roomId}`,
      });
      return next;
    });
  };

  const _handleScheduleFollowUp = (roomId: string) => {
    if (followUps[roomId]) {
      toast({
        title: "ตั้งเวลาไว้แล้ว",
        description: "มีการตั้งเตือนติดตามสำหรับห้องนี้แล้ว",
      });
      return;
    }
    const timestamp = new Date().toISOString();
    setFollowUps((prev) => {
      const next = { ...prev, [roomId]: timestamp };
      toast({
        title: "ตั้งการติดตามแล้ว",
        description: `ระบบจะแจ้งเตือนห้อง ${roomId} เพื่อส่งข้อมูลมิเตอร์ที่ขาด`,
      });
      return next;
    });
  };

  const missingReadings = rooms
    .map((room: Room) => {
      const roomGroups = readingsByRoom.get(room.id) ?? [];
      const currentGroup = roomGroups.find((group) =>
        group.readingDate.startsWith(monthKey),
      );
      const missingElectric = !currentGroup?.electric;
      const missingWater = !isWaterFixed && !currentGroup?.water;
      return {
        room,
        missingElectric,
        missingWater,
        hasMissing: missingElectric || missingWater,
      };
    })
    .filter((item) => item.hasMissing);

  const columns = [
    {
      key: "type",
      header: "ประเภท",
      render: (group: MeterReadingGroup) => (
        <div className="flex items-center gap-2">
          {group.water ? <Droplets className="h-4 w-4 text-blue-500" /> : null}
          {group.electric ? <Zap className="h-4 w-4 text-amber-500" /> : null}
          {!group.water && !group.electric ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "readingDate",
      header: "วันที่",
      searchable: true,
      render: (group: MeterReadingGroup) => (
        <span className="text-muted-foreground">
          {new Date(group.readingDate).toLocaleDateString("th-TH")}
        </span>
      ),
    },
    {
      key: "tenantName",
      header: "ผู้เช่า",
      searchable: true,
      className: "hidden sm:table-cell",
      render: (group: MeterReadingGroup) => (
        <span className="font-medium text-foreground">
          {group.tenantName || "—"}
        </span>
      ),
    },
    {
      key: "roomNumber",
      header: "ห้อง",
      searchable: true,
      render: (group: MeterReadingGroup) => (
        <span className="text-foreground">{group.roomNumber || "—"}</span>
      ),
    },
    {
      key: "previousReading",
      header: "ก่อนหน้า",
      className: "hidden md:table-cell",
      render: (group: MeterReadingGroup) => (
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>
            น้ำ:{" "}
            {group.water?.previousReading?.toLocaleString() ??
              (isWaterFixed ? "เหมาจ่าย" : "—")}
          </div>
          <div>
            ไฟ: {group.electric?.previousReading?.toLocaleString() ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "currentReading",
      header: "ล่าสุด",
      className: "hidden md:table-cell",
      render: (group: MeterReadingGroup) => (
        <div className="space-y-1 text-sm text-foreground">
          <div>
            น้ำ:{" "}
            {group.water?.currentReading?.toLocaleString() ??
              (isWaterFixed ? "เหมาจ่าย" : "—")}
          </div>
          <div>
            ไฟ: {group.electric?.currentReading?.toLocaleString() ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "consumption",
      header: "หน่วยใช้",
      render: (group: MeterReadingGroup) => (
        <div className="space-y-1 text-sm">
          <div className="font-semibold text-primary">
            {group.water?.consumption?.toLocaleString() ??
              (isWaterFixed ? "เหมาจ่าย" : "—")}{" "}
            m³
          </div>
          <div className="font-semibold text-primary">
            {group.electric?.consumption?.toLocaleString() ?? "—"} kWh
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (group: MeterReadingGroup) => (
        <Badge variant={getStatusColor(group.status)}>
          {group.status === "pending"
            ? "รอออกบิล"
            : group.status === "incomplete"
              ? "ไม่ครบ"
              : group.status === "billed"
                ? "ออกบิลแล้ว"
                : group.status === "paid"
                  ? "ชำระแล้ว"
                  : group.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (group: MeterReadingGroup) => {
        const items = [
          !group.water && !isWaterFixed
            ? {
                label: "เพิ่มมิเตอร์น้ำ",
                icon: Droplets,
                onClick: () =>
                  router.push(
                    `/overview/readings/new?roomId=${group.roomId}&date=${group.readingDate}&meter=water`,
                  ),
              }
            : null,
          !group.electric
            ? {
                label: "เพิ่มมิเตอร์ไฟ",
                icon: Zap,
                onClick: () =>
                  router.push(
                    `/overview/readings/new?roomId=${group.roomId}&date=${group.readingDate}&meter=electric`,
                  ),
              }
            : null,
          group.status === "pending" &&
          group.electric &&
          (group.water || isWaterFixed)
            ? {
                label: "สร้างใบแจ้งหนี้",
                icon: FileText,
                onClick: () =>
                  router.push(`/overview/billing?readingId=${group.id}`),
              }
            : null,
        ].filter(Boolean) as {
          label: string;
          icon: typeof Droplets;
          onClick: () => void;
        }[];

        return (
          <TableRowActions
            primary={{
              label: "ดูรายละเอียด",
              icon: Gauge,
              onClick: () => router.push(`/overview/readings/${group.id}`),
            }}
            items={items}
          />
        );
      },
    },
  ];

  const filters = [
    {
      key: "meterType",
      label: "ประเภท",
      options: [
        { value: "water", label: "น้ำ" },
        { value: "electric", label: "ไฟ" },
      ],
      filterFn: (group: MeterReadingGroup, value: string) =>
        value === "water" ? Boolean(group.water) : Boolean(group.electric),
    },
    {
      key: "status",
      label: "สถานะ",
      options: [
        { value: "incomplete", label: "ไม่ครบ" },
        { value: "pending", label: "รอออกบิล" },
        { value: "billed", label: "ออกบิลแล้ว" },
        { value: "paid", label: "ชำระแล้ว" },
      ],
      filterFn: (group: MeterReadingGroup, value: string) =>
        group.status === value,
    },
  ];

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <PageHeader
        title="อ่านมิเตอร์"
        description="บันทึกค่าน้ำและค่าไฟพร้อมกัน หรืออัปเดตทีละมิเตอร์ภายหลังได้"
        actions={
          <Button
            onClick={() => router.push("/overview/readings/new")}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มการอ่านมิเตอร์
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายการอ่านมิเตอร์ทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {groupedReadings.length}
            </div>
            <p className="text-xs text-muted-foreground">เดือนนี้</p>
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
                groupedReadings.filter((group) => group.status === "pending")
                  .length
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
                groupedReadings.filter((group) => group.status === "incomplete")
                  .length
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
                groupedReadings.filter((group) => group.status === "billed")
                  .length
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
            <CardDescription>
              ตรวจสอบห้องและรอบบิลก่อนสร้างใบแจ้งหนี้
            </CardDescription>
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
                {groupedReadings.map((group) => (
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
                <p className="text-2xl font-semibold text-blue-600">
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
                <p className="text-2xl font-semibold text-amber-600">
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
                      onClick={() =>
                        router.push(
                          `/overview/billing?readingId=${selectedGroup.id}`,
                        )
                      }
                      disabled={!isInvoiceReady || hasExistingInvoice}
                      title={
                        hasExistingInvoice
                          ? "มีใบแจ้งหนี้แล้วสำหรับกลุ่มนี้"
                          : !isInvoiceReady
                            ? "กรุณากรอกการอ่านให้ครบก่อน"
                            : undefined
                      }
                    >
                      {hasExistingInvoice ? "มีใบแจ้งหนี้แล้ว" : "สร้างใบแจ้งหนี้"}
                    </Button>
                  </div>
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
              ทุกห้องอัปเดตครบสำหรับเดือนนี้
            </div>
          ) : (
            <DataTable
              data={missingReadings}
              columns={[
                {
                  key: "room",
                  header: "ห้อง",
                  searchable: true,
                  render: (item) => (
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
                  render: (item) => (
                    <div className="flex flex-wrap gap-2">
                      {item.missingWater && (
                        <Badge variant="outline">น้ำ</Badge>
                      )}
                      {item.missingElectric && (
                        <Badge variant="outline">ไฟ</Badge>
                      )}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "การดำเนินการ",
                  render: (item) => (
                    <div className="flex flex-wrap gap-2">
                      {item.missingWater && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/overview/readings/new?roomId=${item.room.id}&date=${monthKey}-01&meter=water`,
                            )
                          }
                        >
                          เพิ่มมิเตอร์น้ำ
                        </Button>
                      )}
                      {item.missingElectric && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/overview/readings/new?roomId=${item.room.id}&date=${monthKey}-01&meter=electric`,
                            )
                          }
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
            <LoadingState message="กำลังโหลดรายการอ่านมิเตอร์..." />
          ) : groupedReadings.length === 0 ? (
            <EmptyState
              icon={<Gauge className="h-8 w-8 text-muted-foreground" />}
              title="ยังไม่มีการอ่านมิเตอร์"
              description="เริ่มติดตามการใช้สาธารณูปโภคด้วยการเพิ่มการอ่านครั้งแรก"
              actionLabel="เพิ่มการอ่านครั้งแรก"
              actionHref="/overview/readings/new"
            />
          ) : (
            <DataTable
              data={groupedReadings}
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
