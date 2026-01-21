"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Droplets, FileText, Gauge, Zap } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { TableRowActions } from "@/components/table-row-actions";
import { useToast } from "@/hooks/use-toast";
import {
  buildingsApi,
  invoicesApi,
  readingsApi,
  roomsApi,
  settingsApi,
} from "@/lib/api-client";
import { getData, getList } from "@/lib/api/response-helpers";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter } from "@/lib/router";
import type { Invoice, MeterReadingGroup, Room } from "@/lib/types";

/**
 * Hook for managing the readings page state and data
 * @returns Object containing queries, data, state, computed values, and helpers
 */
export function useReadingsPage() {
  // Hook implementation
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatingInvoiceId, setGeneratingInvoiceId] = React.useState<
    string | null
  >(null);
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(
    null,
  );
  const [selectedPeriod, setSelectedPeriod] = React.useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  // Queries
  const readingsQuery = useQuery({
    queryKey: ["readings"],
    queryFn: () => readingsApi.getAll(),
  });
  const buildingsQuery = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingsApi.getAll(),
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

  // Mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: (readingGroupId: string) =>
      invoicesApi.generateFromReadingGroup(readingGroupId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["readings"] });
      setGeneratingInvoiceId(null);
      const invoice = getData(data);
      toast({
        title: "สร้างใบแจ้งหนี้แล้ว",
        description: invoice
          ? `สร้างใบแจ้งหนี้ ${invoice.id} สำเร็จ`
          : "สร้างใบแจ้งหนี้สำเร็จ",
      });
      if (invoice) {
        router.push(`/overview/billing/${invoice.id}`);
      }
    },
    onError: (error: any, readingGroupId: string) => {
      setGeneratingInvoiceId(null);
      logError(error, {
        scope: "invoices",
        action: "generate",
        metadata: { readingGroupId },
      });
      toast({
        title: "สร้างใบแจ้งหนี้ไม่สำเร็จ",
        description: getErrorMessage(error, "ไม่สามารถสร้างใบแจ้งหนี้ได้"),
        variant: "destructive",
      });
    },
  });

  // Data extraction
  const readings = getList(readingsQuery.data);
  const buildings = getList(buildingsQuery.data);
  const rooms = getList(roomsQuery.data);
  const settings = getData(settingsQuery.data);
  const isLoading = readingsQuery.isLoading;
  const waterBillingMode = settings?.waterBillingMode ?? "metered";
  const isWaterFixed = waterBillingMode === "fixed";
  const groupedReadings = readings as MeterReadingGroup[];

  // Computed values
  const periodOptions = React.useMemo(() => {
    const options = [{ value: "all", label: "ทุกงวด" }];
    const now = new Date();
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleString("th-TH", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }
    return options;
  }, []);

  const filteredReadings = React.useMemo(() => {
    if (selectedPeriod === "all") {
      return groupedReadings;
    }
    return groupedReadings.filter((group: MeterReadingGroup) =>
      group.readingDate.startsWith(selectedPeriod),
    );
  }, [groupedReadings, selectedPeriod]);

  const uniquePeriods = React.useMemo(() => {
    const set = new Set<string>();
    groupedReadings.forEach((group: MeterReadingGroup) => {
      set.add(group.readingDate.slice(0, 7));
    });
    return set;
  }, [groupedReadings]);

  const hasMixedPeriods = selectedPeriod === "all" && uniquePeriods.size > 1;

  // Auto-select first group when filtered readings change
  React.useEffect(() => {
    if (!filteredReadings.length) {
      setSelectedGroupId(null);
      return;
    }
    if (
      !selectedGroupId ||
      !filteredReadings.some(
        (group: MeterReadingGroup) => group.id === selectedGroupId,
      )
    ) {
      setSelectedGroupId(filteredReadings[0].id);
    }
  }, [filteredReadings, selectedGroupId]);

  const selectedGroup = React.useMemo(() => {
    if (!filteredReadings.length) return null;
    return (
      filteredReadings.find(
        (group: MeterReadingGroup) => group.id === selectedGroupId,
      ) ?? filteredReadings[0]
    );
  }, [filteredReadings, selectedGroupId]);

  // Helper functions
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

  const formatDateParam = (value: string) => {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
    return value;
  };

  const todayValue = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // Computed values for display
  const monthKey =
    selectedPeriod === "all"
      ? new Date().toISOString().slice(0, 7)
      : selectedPeriod;
  const monthLabel =
    selectedPeriod === "all"
      ? "ทุกงวด"
      : new Date(`${monthKey}-01`).toLocaleString("th-TH", {
          month: "long",
          year: "numeric",
        });

  const readingsByRoom = React.useMemo(() => {
    const map = new Map<string, MeterReadingGroup[]>();
    filteredReadings.forEach((group: MeterReadingGroup) => {
      if (!map.has(group.roomId)) {
        map.set(group.roomId, []);
      }
      map.get(group.roomId)?.push(group);
    });
    return map;
  }, [filteredReadings]);

  const selectedGroupMonthLabel = selectedGroup
    ? new Date(selectedGroup.readingDate).toLocaleString("th-TH", {
        month: "long",
        year: "numeric",
      })
    : "";
  const selectedGroupRoomLabel = selectedGroup?.roomNumber ?? "—";
  const selectedGroupStatus = selectedGroup?.status ?? "pending";

  const invoices = getList(invoicesQuery.data);
  const hasExistingInvoice = selectedGroup
    ? invoices.some(
        (invoice: Invoice) => invoice.readingGroupId === selectedGroup.id,
      )
    : false;
  const isInvoiceReady =
    Boolean(selectedGroup?.electric) &&
    (isWaterFixed || Boolean(selectedGroup?.water)) &&
    !hasExistingInvoice;
  const missingReadingsLabel = selectedGroup
    ? [
        !selectedGroup.electric ? "มิเตอร์ไฟ" : null,
        !isWaterFixed && !selectedGroup.water ? "มิเตอร์น้ำ" : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const missingReadings = React.useMemo(() => {
    return rooms
      .map((room: Room) => {
        const roomGroups = readingsByRoom.get(room.id) ?? [];
        const currentGroup = roomGroups.find((group: MeterReadingGroup) =>
          group.readingDate.startsWith(monthKey),
        );
        const missingElectric = !currentGroup?.electric;
        const missingWater = !isWaterFixed && !currentGroup?.water;
        return {
          room,
          currentGroup,
          missingElectric,
          missingWater,
          hasMissing: missingElectric || missingWater,
        };
      })
      .filter(
        (item: {
          room: Room;
          currentGroup: MeterReadingGroup | null;
          missingElectric: boolean;
          missingWater: boolean;
          hasMissing: boolean;
        }) => item.hasMissing,
      );
  }, [rooms, readingsByRoom, monthKey, isWaterFixed]);

  // Table columns
  const columns = React.useMemo(
    () => [
      {
        key: "type",
        header: "ประเภท",
        render: (group: MeterReadingGroup) => (
          <div className="flex items-center gap-2">
            {group.water ? (
              <Droplets className="h-4 w-4 text-blue-500" />
            ) : null}
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
                      `/overview/readings/new?roomId=${group.roomId}&date=${group.readingDate}&meter=water&readingGroupId=${group.id}`,
                    ),
                }
              : null,
            !group.electric
              ? {
                  label: "เพิ่มมิเตอร์ไฟ",
                  icon: Zap,
                  onClick: () =>
                    router.push(
                      `/overview/readings/new?roomId=${group.roomId}&date=${group.readingDate}&meter=electric&readingGroupId=${group.id}`,
                    ),
                }
              : null,
            group.status === "pending" &&
            group.electric &&
            (group.water || isWaterFixed)
              ? {
                  label:
                    generatingInvoiceId === group.id
                      ? "กำลังสร้าง..."
                      : "สร้างใบแจ้งหนี้",
                  icon: FileText,
                  disabled: generatingInvoiceId !== null,
                  onClick: () => {
                    setGeneratingInvoiceId(group.id);
                    generateInvoiceMutation.mutate(group.id);
                  },
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
    ],
    [
      isWaterFixed,
      generatingInvoiceId,
      router,
      generateInvoiceMutation,
      setGeneratingInvoiceId,
    ],
  );

  const filters = React.useMemo(
    () => [
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
    ],
    [],
  );

  return {
    // Queries
    readingsQuery,
    buildingsQuery,
    settingsQuery,
    roomsQuery,
    invoicesQuery,
    // Data
    readings: groupedReadings,
    buildings,
    rooms,
    settings,
    isLoading,
    isWaterFixed,
    // State
    selectedPeriod,
    setSelectedPeriod,
    selectedGroupId,
    setSelectedGroupId,
    generatingInvoiceId,
    setGeneratingInvoiceId,
    // Computed
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
    // Helpers
    getStatusColor,
    formatDateParam,
    todayValue,
    // Table config
    columns,
    filters,
    // Mutations
    generateInvoiceMutation,
    // Router
    router,
  };
}
