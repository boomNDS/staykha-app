"use client";

import { useQuery } from "@tanstack/react-query";
import { Droplets, FileText, Gauge, Plus, Zap } from "lucide-react";
import * as React from "react";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
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
import { readingsApi, roomsApi, settingsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "@/lib/router";
import type { MeterReadingGroup, Room } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";

export default function ReadingsPage() {
  usePageTitle("Meter Readings");

  const router = useRouter();
  const { user } = useAuth();
  const readingsQuery = useQuery({
    queryKey: ["readings"],
    queryFn: () => readingsApi.getAll(),
  });
  const settingsQuery = useQuery({
    queryKey: ["settings", user?.teamId],
    queryFn: () => {
      if (!user?.teamId) {
        throw new Error("Team ID is required to load settings");
      }
      return settingsApi.get(user.teamId);
    },
    enabled: !!user?.teamId,
  });
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: () => roomsApi.getAll(),
  });
  const readings = readingsQuery.data?.readings ?? [];
  const rooms = roomsQuery.data?.rooms ?? [];
  const waterBillingMode =
    settingsQuery.data?.settings.waterBillingMode ?? "metered";
  const isWaterFixed = waterBillingMode === "fixed";
  const { toast } = useToast();
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
  const isLoading = readingsQuery.isLoading;
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

  const groupedReadings = readings as MeterReadingGroup[];

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

  const monthLabel = new Date().toLocaleString("default", {
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

  const selectedGroup = React.useMemo(() => {
    if (!groupedReadings.length) return null;
    return (
      groupedReadings.find((group) => group.id === selectedGroupId) ??
      groupedReadings[0]
    );
  }, [groupedReadings, selectedGroupId]);

  const selectedGroupMonthLabel = selectedGroup
    ? new Date(selectedGroup.readingDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })
    : "";
  const selectedGroupRoomLabel = selectedGroup?.roomNumber ?? "—";
  const selectedGroupStatus = selectedGroup?.status ?? "pending";
  const isInvoiceReady =
    Boolean(selectedGroup?.electric) &&
    (isWaterFixed || Boolean(selectedGroup?.water));

  const _handleReminder = (roomId: string, type: "water" | "electric") => {
    const key = `${roomId}-${type}`;
    const timestamp = new Date().toISOString();
    setReminderHistory((prev) => {
      const next = { ...prev, [key]: timestamp };
      toast({
        title: "Reminder queued",
        description: `Sent ${type} reminder for room ${roomId}`,
      });
      return next;
    });
  };

  const _handleScheduleFollowUp = (roomId: string) => {
    if (followUps[roomId]) {
      toast({
        title: "Already scheduled",
        description: "A follow-up reminder is already queued for this room.",
      });
      return;
    }
    const timestamp = new Date().toISOString();
    setFollowUps((prev) => {
      const next = { ...prev, [roomId]: timestamp };
      toast({
        title: "Follow-up scheduled",
        description: `Will notify room ${roomId} to provide missing meters.`,
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

  const columns = [
    {
      key: "type",
      header: "Type",
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
      header: "Date",
      searchable: true,
      render: (group: MeterReadingGroup) => (
        <span className="text-muted-foreground">
          {new Date(group.readingDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "tenantName",
      header: "Tenant",
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
      header: "Room",
      searchable: true,
      render: (group: MeterReadingGroup) => (
        <span className="text-foreground">{group.roomNumber || "—"}</span>
      ),
    },
    {
      key: "previousReading",
      header: "Previous",
      className: "hidden md:table-cell",
      render: (group: MeterReadingGroup) => (
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>
            W:{" "}
            {group.water?.previousReading?.toLocaleString() ??
              (isWaterFixed ? "Fixed" : "—")}
          </div>
          <div>
            E: {group.electric?.previousReading?.toLocaleString() ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "currentReading",
      header: "Current",
      className: "hidden md:table-cell",
      render: (group: MeterReadingGroup) => (
        <div className="space-y-1 text-sm text-foreground">
          <div>
            W:{" "}
            {group.water?.currentReading?.toLocaleString() ??
              (isWaterFixed ? "Fixed" : "—")}
          </div>
          <div>
            E: {group.electric?.currentReading?.toLocaleString() ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "consumption",
      header: "Usage",
      render: (group: MeterReadingGroup) => (
        <div className="space-y-1 text-sm">
          <div className="font-semibold text-primary">
            {group.water?.consumption?.toLocaleString() ??
              (isWaterFixed ? "Fixed" : "—")}{" "}
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
      header: "Status",
      render: (group: MeterReadingGroup) => (
        <Badge variant={getStatusColor(group.status)}>{group.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (group: MeterReadingGroup) => {
        const items = [
          !group.water && !isWaterFixed
            ? {
                label: "Add water",
                icon: Droplets,
                onClick: () =>
                  router.push(
                    `/overview/readings/new?roomId=${group.roomId}&date=${group.readingDate}&meter=water`,
                  ),
              }
            : null,
          !group.electric
            ? {
                label: "Add electric",
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
                label: "Generate invoice",
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
              label: "View",
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
      label: "Type",
      options: [
        { value: "water", label: "Water" },
        { value: "electric", label: "Electric" },
      ],
      filterFn: (group: MeterReadingGroup, value: string) =>
        value === "water" ? Boolean(group.water) : Boolean(group.electric),
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "incomplete", label: "Incomplete" },
        { value: "pending", label: "Pending" },
        { value: "billed", label: "Billed" },
        { value: "paid", label: "Paid" },
      ],
      filterFn: (group: MeterReadingGroup, value: string) =>
        group.status === value,
    },
  ];

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <PageHeader
        title="Meter Readings"
        description="Capture water and electric readings together or complete one meter at a time."
        actions={
          <Button
            onClick={() => router.push("/overview/readings/new")}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Reading
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Readings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {groupedReadings.length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                groupedReadings.filter((group) => group.status === "pending")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Awaiting billing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incomplete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                groupedReadings.filter((group) => group.status === "incomplete")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Missing a meter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {
                groupedReadings.filter((group) => group.status === "billed")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Group detail</CardTitle>
            <CardDescription>
              Review the room/month combination before generating billing
            </CardDescription>
          </div>
          <div className="min-w-[200px]">
            <Select
              value={selectedGroup?.id ?? ""}
              onValueChange={(value) => setSelectedGroupId(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent>
                {groupedReadings.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.roomNumber} •{" "}
                    {new Date(group.readingDate).toLocaleString("default", {
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
                  Room & period
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Room {selectedGroupRoomLabel}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedGroupMonthLabel}
                </p>
                <Badge
                  variant={getStatusColor(selectedGroupStatus)}
                  className="mt-3"
                >
                  {selectedGroupStatus}
                </Badge>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Water
                </p>
                <p className="text-2xl font-semibold text-blue-600">
                  {selectedGroup.water
                    ? `${selectedGroup.water.consumption.toLocaleString()} m³`
                    : isWaterFixed
                      ? "Fixed"
                      : "Missing"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGroup.water
                    ? `Prev ${selectedGroup.water.previousReading} • Curr ${selectedGroup.water.currentReading}`
                    : isWaterFixed
                      ? "Fixed monthly fee"
                      : "Waiting for reading"}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Electric
                </p>
                <p className="text-2xl font-semibold text-amber-600">
                  {selectedGroup.electric
                    ? `${selectedGroup.electric.consumption.toLocaleString()} kWh`
                    : "Missing"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedGroup.electric
                    ? `Prev ${selectedGroup.electric.previousReading} • Curr ${selectedGroup.electric.currentReading}`
                    : "Awaiting electric meter"}
                </p>
              </div>
              <div className="rounded-2xl border border-border p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Actions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/overview/readings/${selectedGroup.id}`)
                      }
                    >
                      View details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/overview/billing?readingId=${selectedGroup.id}`,
                        )
                      }
                      disabled={!isInvoiceReady}
                    >
                      Generate invoice
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grouped reading ID:{" "}
                  <span className="font-mono">{selectedGroup.id}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No meter readings yet to summarize.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missing Readings • {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {missingReadings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              All rooms are up to date this month.
            </div>
          ) : (
            <DataTable
              data={missingReadings}
              columns={[
                {
                  key: "room",
                  header: "Room",
                  searchable: true,
                  render: (item) => (
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Room {item.room.roomNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.room.buildingName}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "missing",
                  header: "Missing",
                  render: (item) => (
                    <div className="flex flex-wrap gap-2">
                      {item.missingWater && (
                        <Badge variant="outline">Water</Badge>
                      )}
                      {item.missingElectric && (
                        <Badge variant="outline">Electric</Badge>
                      )}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
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
                          Add Water
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
                          Add Electric
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              searchPlaceholder="Search rooms..."
              pageSize={5}
              forcePagination
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Readings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Loading readings..." />
          ) : groupedReadings.length === 0 ? (
            <EmptyState
              icon={<Gauge className="h-8 w-8 text-muted-foreground" />}
              title="No meter readings yet"
              description="Start tracking utility usage by adding your first meter reading"
              actionLabel="Add First Reading"
              actionHref="/overview/readings/new"
            />
          ) : (
            <DataTable
              data={groupedReadings}
              columns={columns}
              searchPlaceholder="Search by tenant, room, or date..."
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
